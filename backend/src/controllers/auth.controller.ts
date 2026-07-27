import type { AuthRequest } from '../middleware/auth';
import type { Request, Response, NextFunction } from 'express';
import { User } from '../models/user';
import { getAuth, clerkClient } from '@clerk/express';
import { AppError } from '../utils/AppError';

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.userId;

        const user = await User.findById(userId).select('-password');

        if (!user) {
            return next(new AppError("User not found", 404));
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
            return next(new AppError("Unauthorized - invalid token", 401));
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