import { verifyToken } from "@clerk/express";
import { Server as HttpServer } from "http";
import mongoose, { Types } from "mongoose";
import { Server as SocketServer } from "socket.io";
import { Chat } from "../models/chat";
import { Message } from "../models/message";
import { User } from "../models/user";

export const onlineUsers: Map<string, Set<string>> = new Map();

export const initializeSocket = (httpServer: HttpServer) => {
    const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:8081",
        process.env.FRONTEND_URL,
    ].filter(Boolean) as string[];

    const io = new SocketServer(httpServer, { cors: { origin: allowedOrigins } });

    // verify socket connection
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication token is missing"));
        }

        try {
            const session = await verifyToken(token, {
                secretKey: process.env.CLERK_SECRET_KEY!
            });
            const clerkId = session.sub;
            const user = await User.findOne({ clerkId }).select("_id");
            if (!user) {
                return next(new Error("User not found"));
            }
            socket.data.userId = user._id.toString();
            next();
        } catch (error) {
            return next(new Error("Invalid authentication token"));
        }
    });

    // main socket connections handler
    io.on("connection", (socket) => {
        const userId = socket.data.userId;

        const userSockets = onlineUsers.get(userId) || new Set<string>();
        const isFirstConnection = userSockets.size === 0;

        userSockets.add(socket.id);
        onlineUsers.set(userId, userSockets);

        // send list of currently online user to new connected user
        socket.emit("online-users", { userIds: Array.from(onlineUsers.keys()) });

        // notify all users about the new online user
        if (isFirstConnection) {
            socket.broadcast.emit("user-online", { userId });
        }

        // Join personal user room for targeted updates
        socket.join(`user:${userId}`);

        socket.on("join-chat", async (chatId: string) => {
            if (typeof chatId !== "string" || !Types.ObjectId.isValid(chatId)) {
                socket.emit("socket-error", { message: "Invalid chat ID" });
                return;
            }

            const isParticipant = await Chat.exists({ _id: chatId, participants: userId });
            if (!isParticipant) {
                socket.emit("socket-error", { message: "Unauthorized or chat not found" });
                return;
            }

            socket.join(`chat:${chatId}`);
        });

        // leave active chat room
        socket.on("leave-chat", (chatId: string) => {
            if (typeof chatId === "string") {
                socket.leave(`chat:${chatId}`);
            }
        });

        // send message handler
        socket.on("send-message",
            async (
                data: { chatId: string; text: string },
                callback?: (response: { success: boolean; error?: string }) => void
            ) => {
                // Validation
                if (!data || typeof data !== "object") {
                    const errorMsg = "Invalid message payload";
                    socket.emit("socket-error", { message: errorMsg });
                    return callback?.({
                        success: false,
                        error: "Invalid payload"
                    });
                }
                const { chatId, text } = data;
                // Validation
                if (!chatId || !Types.ObjectId.isValid(chatId)) {
                    const err = "Invalid chat ID";
                    socket.emit("socket-error", { message: err });
                    if (callback) callback({ success: false, error: err });
                    return;
                }

                if (typeof text !== "string" || !text.trim() || text.trim().length > 5000) {
                    const err = "Message text must be between 1 and 5000 characters";
                    socket.emit("socket-error", { message: err });
                    if (callback) callback({ success: false, error: err });
                    return;
                }

                const sanitizedText = text.trim();
                const session = await mongoose.startSession();
                try {
                    session.startTransaction();

                    const chat = await Chat.findOne({
                        _id: chatId,
                        participants: userId,
                    }).session(session);

                    if (!chat) {
                        await session.abortTransaction();
                        const err = "Chat not found or unauthorized";
                        socket.emit("socket-error", { message: err });
                        if (callback) callback({ success: false, error: err });
                        return;
                    }

                    const message = new Message({
                        chat: chatId,
                        sender: userId,
                        text: sanitizedText,
                    });
                    await message.save({ session });

                    // Update the chat with the new message
                    chat.lastMessage = message._id;
                    chat.lastMessageAt = new Date();
                    await chat.save({ session });

                    await session.commitTransaction();

                    // Populate sender details for clients
                    await message.populate("sender", "_id name email avatar");

                    // emit to clients actively inside this specific chat room
                    io.to(`chat:${chatId}`).emit("new-message", message);

                    // emit to all chat participants personal rooms for sidebars/chat lists
                    for (const participantId of chat.participants) {
                        io.to(`user:${participantId.toString()}`).emit("chat-list-update", {
                            chatId,
                            lastMessage: message,
                            lastMessageAt: chat.lastMessageAt,
                        });
                    }

                    // Acknowledge success back to the sender
                    if (callback) callback({ success: true });
                } catch (error) {
                    if (session.inTransaction()) {
                        await session.abortTransaction();
                    }
                    console.error("Socket send-message error:", error);
                    const errorMsg = "Failed to send message";
                    socket.emit("socket-error", { message: errorMsg });
                    if (callback) callback({ success: false, error: errorMsg });
                } finally {
                    session.endSession();
                }
            });

        // typing indicator handler
        socket.on("typing", async (data: { chatId: string; isTyping: boolean }) => {
            if (!data || !data?.chatId || typeof data.isTyping !== "boolean") return;

            // verify user is actually a participant in this chat
            const chat = await Chat.findOne({ _id: data.chatId, participants: userId }).select("participants");
            if (!chat) return;
            const typingPayload = {
                userId,
                chatId: data.chatId,
                isTyping: data.isTyping
            };
            // emit to users actively viewing this chat
            socket.to(`chat:${data.chatId}`).emit("typing", typingPayload);

            // also emit to other participant's personal room (for chat list status)
            try {
                const chat = await Chat.findById(data.chatId).select("participants");
                if (chat) {
                    // Find the other participant (not the current user)
                    const otherParticipantId = chat.participants.filter((p) => p.toString() !== userId);
                    for (const participantId of otherParticipantId) {
                        socket.to(`user:${participantId.toString()}`).emit("typing", typingPayload);
                    }
                }
            } catch (error) {
                console.error("Error handling typing indicator:", error);
            }
        });

        // disconnect handler
        socket.on("disconnect", () => {
            const userSockets = onlineUsers.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);
                    socket.broadcast.emit("user-offline", { userId });
                }
            }
        });
    });

    return io;
};