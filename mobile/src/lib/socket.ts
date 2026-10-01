import * as Sentry from "@sentry/react-native";
import type { QueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { create } from 'zustand';
import { chatsQueryKey } from "../hooks/useChats";
import type { Chat, Message } from '../types';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL;
if (!SOCKET_URL) throw new Error("EXPO_PUBLIC_API_URL is not defined in the environment variables.");

interface SocketState {
    socket: Socket | null;
    isConnected: boolean;
    onlineUsers: Set<string>;
    typingUsers: Map<string, string>;
    currentChatId: string | null;
    queryClient: QueryClient | null;

    connect: (getToken: () => Promise<string | null>, queryClient: QueryClient, userId?: string) => void;
    disconnect: () => void;
    joinChat: (chatId: string) => void;
    leaveChat: (chatId: string) => void;
    sendMessage: (chatId: string, text: string, currentUser: any) => void;
    sendTyping: (chatId: string, isTyping: boolean) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,
    isConnected: false,
    onlineUsers: new Set(),
    typingUsers: new Map(),
    currentChatId: null,
    queryClient: null,

    connect: (getToken, queryClient, userId) => {
        const existingSocket = get().socket;
        if (existingSocket?.connected) return;
        if (existingSocket) {
            if (!existingSocket.active) {
                existingSocket.connect();
            }
            return;
        }

        const socket = io(SOCKET_URL, {
            auth: async (cb) => {
                try {
                    const freshToken = await getToken();
                    cb({ token: freshToken });
                } catch (err) {
                    console.error("Failed to fetch fresh token for socket auth: ", err);
                    cb({ token: null });
                }
            },
            autoConnect: false,
            timeout: 10000, // waiting for server cold start (~30-45s) will hang the socket connection, so we need a shorter timeout rather than the default 20s or 45s used earlier
            reconnection: true,
            reconnectionAttempts: 15,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            randomizationFactor: 0.5, // Adds randomness so multiple clients don't DDOS the server
        });
        socket.on("connect", () => {
            Sentry.logger.info("Socket connected", { socketId: socket.id });
            set({ isConnected: true });

            // re-join active chat on reconnect
            const currentChatId = get().currentChatId;
            if (currentChatId) {
                socket.emit("join-chat", currentChatId);
            }
        });

        socket.on("connect_error", (error: Error) => {
            console.error("Socket connection error:", error.message);
            Sentry.logger.error("Socket connection error occurred", {
                message: error.message,
            });

            // Stop retrying if token is rejected (invalid or expired)
            if (error.message.toLowerCase().includes("auth") || error.message.toLowerCase().includes("jwt")) {
                set({ isConnected: false });
            }
        });

        socket.on("socket-error", (error: { message: string }) => {
            console.error("Socket error:", error.message);
            Sentry.logger.error("Socket error occured", {
                message: error.message,
            });
        });

        socket.on("disconnect", () => {
            Sentry.logger.info("Socket disconnected", { socketId: socket.id });
            set({ isConnected: false });
        });

        socket.on("online-users", ({ userIds }: { userIds: string[] }) => {
            set({ onlineUsers: new Set(userIds) });
        });

        socket.on("user-online", ({ userId }: { userId: string }) => {
            set((state) => ({
                onlineUsers: new Set([...state.onlineUsers, userId]),
            }));
        });

        socket.on("user-offline", ({ userId }: { userId: string }) => {
            set((state) => {
                const onlineUsers = new Set(state.onlineUsers);
                onlineUsers.delete(userId);
                return { onlineUsers };
            });
        });

        socket.on("typing", ({ userId, chatId, isTyping }: { userId: string; chatId: string; isTyping: boolean }) => {
            set((state) => {
                const typingUsers = new Map(state.typingUsers);
                if (isTyping) typingUsers.set(chatId, userId);
                else typingUsers.delete(chatId);

                return { typingUsers };
            });
        });

        // clear local unread count when join-chat succeeds
        socket.on("unread-reset", ({ chatId }: { chatId: string }) => {
            queryClient.setQueryData<Chat[]>(chatsQueryKey(userId), (oldChats) => {
                if (!oldChats) return [];
                return oldChats.map((c) => c._id === chatId ? { ...c, unreadCount: 0 } : c
                );
            })
        })

        socket.on("new-message", (message: Message) => {

            // add message to the chat's message list, replacing optimistic messages
            queryClient.setQueryData<Message[]>(["messages", message.chat], (old) => {
                if (!old) return [message];
                const hasReal = old.some((m) => m._id === message._id);
                if (hasReal) {
                    return old.map((m) => (m._id === message._id ? message : m));
                }
                const tempIndex = old.findIndex((m) => m._id.startsWith("temp-") && m.text === message.text);
                if (tempIndex !== -1) {
                    const copy = [...old];
                    copy[tempIndex] = message;
                    return copy;
                }
                return [...old, message];
            });

            // clear typing indicator when message received
            set((state) => {
                const typingUsers = new Map(state.typingUsers);
                typingUsers.delete(message.chat);
                return { typingUsers };
            });
        });

        // real-time sidebar update feeding directly into tanstack query
        socket.on("chat-list-update", ({ chatId, lastMessage, lastMessageAt, unreadCount }: {
            chatId: string;
            lastMessage: Message;
            lastMessageAt: string;
            unreadCount?: number;
        }) => {
            let matchFound = false;

            queryClient.setQueryData<Chat[]>(chatsQueryKey(userId), (oldChats) => {
                if (!oldChats) return [];
                const updatedChats = oldChats.map((chat) => {
                    if (chat._id === chatId) {
                        matchFound = true;
                        return {
                            ...chat,
                            lastMessage,
                            lastMessageAt,
                            unreadCount: unreadCount ?? chat.unreadCount ?? 0,
                        };
                    }
                    return chat;
                });

                // Sort chats by most recent message date
                return updatedChats.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
            });

            // if no chat matched in cache, refetch list to bring down the new chat
            if (!matchFound) {
                queryClient.invalidateQueries({ queryKey: ["chats"] });
            }
        });

        set({ socket, queryClient });
        socket.connect();
    },

    disconnect: () => {
        const socket = get().socket;
        if (socket) {
            socket.removeAllListeners();
            socket.disconnect();
            set({
                socket: null,
                isConnected: false,
                onlineUsers: new Set(),
                typingUsers: new Map(),
                currentChatId: null,
                queryClient: null,
            });
        }
    },

    joinChat: (chatId) => {
        const socket = get().socket;
        set({ currentChatId: chatId });
        if (socket?.connected) {
            socket.emit("join-chat", chatId);
        }
    },

    leaveChat: (chatId) => {
        const { socket } = get();
        set({ currentChatId: null });
        if (socket?.connected) {
            socket.emit("leave-chat", chatId);
        }
    },

    sendMessage: (chatId, text, currentUser) => {
        const { socket, queryClient } = get();

        // Prevent empty messages or whitespace-only messages
        const trimmedText = text.trim();
        if (!trimmedText || trimmedText.length > 5000) return;
        if (!socket?.connected || !queryClient) return;

        // optimistic updates
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
            _id: tempId,
            chat: chatId,
            sender: {
                _id: currentUser._id || currentUser.id,
                name: currentUser.fullName || currentUser.firstName || currentUser.name || 'You',
                email: currentUser.primaryEmailAddress?.emailAddress || currentUser.email || '',
                avatar: currentUser.imageUrl || currentUser.avatar || '',
            },
            text: trimmedText,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // add optimistic message immediately
        queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
            if (!old) return [optimisticMessage];
            return [...old, optimisticMessage];
        });

        socket.timeout(5000).emit(
            "send-message",
            { chatId, text: trimmedText },
            (err: Error | null, response: { success: boolean; error?: string }) => {
                if (err || !response?.success) {
                    Sentry.logger.error("Failed to send message", {
                        chatId,
                        error: err ? "Socket timeout" : (response?.error || "Socket error"),
                    });
                    // Revert optimistic message on error or timeout
                    queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
                        if (!old) return [];
                        return old.filter((msg) => msg._id !== tempId);
                    });
                } else {
                    Sentry.logger.info("Message sent successfully", { chatId, messageLength: trimmedText.length });
                }
            });
    },

    sendTyping: (chatId, isTyping) => {
        const { socket } = get();
        if (socket?.connected) {
            socket.emit("typing", { chatId, isTyping });
        }
    },
}));