import { Socket, Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyToken } from "@clerk/express";
import { Message } from "../models/message";
import { Chat } from "../models/chat";
import { User } from "../models/user";
import { AppError } from "./AppError";

interface SocketWithUserId extends Socket {
    userId: string;
}

export const onlineUsers: Map<string, string> = new Map();

export const initializeSocket = (httpServer: HttpServer) => {
    const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:8081",
        process.env.FRONTEND_URL as string,
    ];
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
            (socket as SocketWithUserId).userId = user._id.toString();
            next();
        } catch (error) {
            return next(new AppError("Invalid authentication token", 401));
        }
    })

    io.on("connection", (socket) => {
        const userId = (socket as SocketWithUserId).userId;

        // onlineUsers.set(userId, socket.id);
        // send currently online user to new connected user
        socket.emit("online-users", { userId: Array.from(onlineUsers.keys()) });

        // store user in the online users map
        onlineUsers.set(userId, socket.id);

        // notify all users about the new online user
        socket.broadcast.emit("user-online", { userId });

        socket.join(`user: ${userId}`);

        socket.on("join-chat", (chatId: string) => {
            socket.join(`chat: ${chatId}`);
        });

        socket.on("leave-chat", (chatId: string) => {
            socket.leave(`chat: ${chatId}`);
        });

        // handle sending messages
        socket.on("send-message", async (data: { chatId: string; text: string }) => {
            try {
                const { chatId, text } = data;
                const chat = await Chat.findOne({
                    _id: chatId,
                    participants: userId,
                });

                if (!chat) {
                    socket.emit("socket-error", { message: "Chat not found" });
                    return;
                }

                const message = await Message.create({
                    chat: chatId,
                    sender: userId,
                    text,
                });

                chat.lastMessage = message._id;
                chat.lastMessageAt = new Date();
                await chat.save();

                await message.populate("sender", "name email avatar");

                // emit to chat room (for user inside the chat)
                io.to(`chat: ${chatId}`).emit("new-message", message);

                // emit to participants personal rooms (for chat list view update)
                for (const participantId of chat.participants) {
                    io.to(`user: ${participantId}`).emit("new-message", {
                        message,
                    });
                }
            } catch (error) {
                socket.emit("socket-error", { message: "Failed to send message" });
            }
        });

        // TODO: handle typing indicator
        socket.on("typing", async (data) => {})

        socket.on("disconnect", () => {
            onlineUsers.delete(userId);

            // notify others
            socket.broadcast.emit("user-offline", { userId });
        })
    });

    return io;
};
