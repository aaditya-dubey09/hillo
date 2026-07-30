import { Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyToken } from "@clerk/express";
import { Message } from "../models/message";
import { Chat } from "../models/chat";
import { User } from "../models/user";
import { AppError } from "./AppError";
import mongoose, { Types } from "mongoose";

export const onlineUsers: Map<string, Set<string>> = new Map();

export const initializeSocket = (httpServer: HttpServer) => {
    const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:8081",
        process.env.FRONTEND_URL,
    ].filter(Boolean) as string[];

    const io = new SocketServer(httpServer, { cors: { origin: allowedOrigins } })

    // verify socket connection
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new AppError("Authentication token is missing", 401));
        }

        try {
            const session = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
            const clerkId = session.sub;
            const user = await User.findOne({ clerkId });
            if (!user) {
                return next(new AppError("User not found", 404));
            }
            socket.data.userId = user._id.toString();
            next();
        } catch (error) {
            return next(new AppError("Invalid authentication token", 401));
        }
    })

    io.on("connection", (socket) => {
        const userId = socket.data.userId;

        const userSockets = onlineUsers.get(userId) || new Set<string>();
        const isFirstConnection = userSockets.size === 0;

        userSockets.add(socket.id);
        onlineUsers.set(userId, userSockets);

        // send currently online user to new connected user
        socket.emit("online-users", { userId: Array.from(onlineUsers.keys()) });

        // notify all users about the new online user
        if (isFirstConnection) {
            socket.broadcast.emit("user-online", { userId });
        }

        socket.join(`user: ${userId}`);

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

            socket.join(`chat: ${chatId}`);
        });

        socket.on("leave-chat", (chatId: string) => {
            socket.leave(`chat: ${chatId}`);
        });

        // handle sending messages
        socket.on("send-message", async (data: { chatId: string; text: string }) => {
            const { chatId, text } = data;
            if (!chatId || !Types.ObjectId.isValid(chatId)) {
                socket.emit("socket-error", { message: "Invalid chat ID" });
                return;
            }

            const session = await mongoose.startSession();
            try {
                session.startTransaction();

                const chat = await Chat.findOne({
                    _id: chatId,
                    participants: userId,
                }).session(session);

                if (!chat) {
                    await session.abortTransaction();
                    session.endSession();
                    socket.emit("socket-error", { message: "Chat not found" });
                    return;
                }

                const message = new Message({
                    chatId: chatId,
                    sender: userId,
                    text,
                });
                await message.save({ session });

                chat.lastMessage = message._id;
                chat.lastMessageAt = new Date();
                await chat.save({ session });

                await session.commitTransaction();
                session.endSession();

                // Populate sender details for emission
                await message.populate("sender", "name avatar");

                // emit to chat room (for user inside active chat)
                io.to(`chat: ${chatId}`).emit("new-message", message);

                // emit to participants personal rooms (for chat list update)
                for (const participantId of chat.participants) {
                    io.to(`user: ${participantId}`).emit("chat-list-update", {
                        chatId,
                        lastMessage: message,
                        lastMessageAt: chat.lastMessageAt,
                    });
                }
            } catch (error) {
                if (session.inTransaction()) {
                    await session.abortTransaction();
                }
                session.endSession();
                socket.emit("socket-error", { message: "Failed to send message" });
            }
        });

        // TODO: handle typing indicator
        socket.on("typing", async (data) => { })

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
