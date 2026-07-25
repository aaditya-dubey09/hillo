import type { AuthRequest } from '../middleware/auth';
import type { Request, Response, NextFunction } from 'express';
import { User } from '../models/user';
import { getAuth, clerkClient } from '@clerk/express';

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.userId;

        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

export async function authCallback(req: Request, res: Response, next: NextFunction) {
    try {
        const { userId: clerkId } = getAuth(req);

        if (!clerkId) {
            return res.status(401).json({ message: "Unauthorized - invalid token" });
        }

        let user = await User.findOne({ clerkId });

        if (!user) {
            const clerkUser = await clerkClient.users.getUser(clerkId);

            user = await User.findOneAndUpdate(
                { clerkId },
                {
                    $setOnInsert: {
                        clerkId,
                        name: clerkUser.firstName
                            ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
                            : clerkUser.emailAddresses[0]?.emailAddress.split("@")[0] || "User",
                        email: clerkUser.emailAddresses[0]?.emailAddress,
                        avatar: clerkUser.imageUrl || ""
                    }
                },
                { upsert: true, new: true }
            );
        }

        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}