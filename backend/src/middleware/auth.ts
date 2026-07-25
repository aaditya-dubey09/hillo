import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { User } from "../models/user";

export type AuthRequest = Request & {
    userId?: string
};

export const protectRoute = [
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { userId: clerkId } = getAuth(req);
            if (!clerkId) {
                return res.status(401).json({ message: "Unauthorized - invalid token" });
            };

            const user = await User.findOne({ clerkId });
            if (!user) return res.status(401).json({ message: "Unauthorized - user not found" });

            req.userId = user._id.toString();
            next();
        } catch (error) {
            console.error("Error in protectRoute middleware:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        };
    }
];
