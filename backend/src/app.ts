import express from "express";
import authRoutes from "./routes/auth.route";
import chatRoutes from "./routes/chat.route";
import messageRoutes from "./routes/message.route";
import userRoutes from "./routes/user.route";
import { clerkMiddleware } from '@clerk/express';
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(express.json());

app.use(clerkMiddleware());

app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

app.use(errorHandler);

export default app;
