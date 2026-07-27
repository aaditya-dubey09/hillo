import type { AuthRequest } from '../middleware/auth';
import type { Response, NextFunction } from 'express';
import { User } from '../models/user';
import { Chat } from '../models/chat';
import { AppError } from '../utils/AppError';
import { Types } from 'mongoose';

export async function getChats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.userId;
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const chats = await Chat.find({ participants: userId })
            .populate('participants', 'name email avatar')
            .populate("lastMessage")
            .sort({ lastMessageAt: -1 });

        const formattedChats = chats.map(chat => {
            const otherParticipant = chat.participants.find(p => p._id.toString() !== userId);
            return {
                _id: chat._id,
                participants: otherParticipant ?? null,
                lastMessage: chat.lastMessage,
                lastMessageAt: chat.lastMessageAt,
                createdAt: chat.createdAt,
            };
        });

        res.status(200).json(formattedChats);
    } catch (error) {
        next(error);
    }
}

export async function getOrCreateChat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.userId;
        const { participantId } = req.params;

        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        if (!participantId) {
            return next(new AppError("Participant ID is required", 400));
        }

        if (typeof participantId !== 'string' || !Types.ObjectId.isValid(participantId)) {
            return next(new AppError("Invalid participant ID", 400));
        }

        if (userId === participantId) {
            return next(new AppError("Cannot create chat with yourself", 400));
        }

        const participantExists = await User.exists({ _id: participantId });
        if (!participantExists) {
            return next(new AppError("Participant not found", 404));
        }

        let chat = await Chat.findOne({
            participants: { $all: [userId, participantId] }
        })
            .populate('participants', 'name email avatar')
            .populate("lastMessage");
        
        if (!chat) {
            const newChat = new Chat({
                participants: [userId, participantId],
            });
            await newChat.save();
            chat = await newChat.populate('participants', 'name email avatar');
        }

        const otherParticipant = chat.participants.find(p => p._id.toString() !== userId);

        res.status(200).json({
            _id: chat._id,
            participants: otherParticipant ?? null,
            lastMessage: chat.lastMessage,
            lastMessageAt: chat.lastMessageAt,
            createdAt: chat.createdAt,
        })
    } catch (error) {
        next(error);
    }
}