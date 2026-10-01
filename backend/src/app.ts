import { clerkMiddleware } from '@clerk/express';
import cors from "cors";
import express from "express";
import path from "path";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.route";
import chatRoutes from "./routes/chat.route";
import messageRoutes from "./routes/message.route";
import userRoutes from "./routes/user.route";

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:8081",
    process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use(express.json());
app.use(clerkMiddleware());

// todo: fetch this endpoint to check if the server is running before making any other requests to the server
app.get("/health", (req, res) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString()
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

app.use(errorHandler);

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../../web/dist")));

    app.get("/{*any}", (_req, res) => {
        res.sendFile(path.join(__dirname, "../../web/dist/index.html"));
    });
}

export default app;
