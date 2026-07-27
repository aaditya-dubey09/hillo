import type { NextFunction, Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { Message } from '../models/message';
import { Chat } from '../models/chat';
import { AppError } from '../utils/AppError';
import { Types } from 'mongoose';

export async function getMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.userId;
        const { chatId } = req.params;

        if (!chatId) {
            return next(new AppError("Chat ID is required", 400));
        }

        if (typeof chatId !== 'string' || !Types.ObjectId.isValid(chatId)) {
            return next(new AppError("Invalid chat ID", 400));
        }

        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        });

        if (!chat) {
            return next(new AppError("Chat not found", 404));
        }

        const messages = await Message.find({ chatId: chatId }).populate('sender', 'name email avatar').sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        next(error);
    }
}