import type { QueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { create } from 'zustand';
import type { Chat, Message, MessageSender } from '../types';
import { chatsQueryKey } from "../hooks/useChats";

const SOCKET_URL = import.meta.env.VITE_API_URL;

interface SocketState {
    socket: Socket | null;
    isConnected: boolean;
    onlineUsers: Set<string>;
    typingUsers: Map<string, string>;
    unreadChats: Set<string>;
    currentChatId: string | null;
    queryClient: QueryClient | null;

    connect: (token: string, queryClient: QueryClient, userId?: string) => void;
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
    unreadChats: new Set(),
    currentChatId: null,
    queryClient: null,

    connect: (token, queryClient, userId) => {
        const existingSocket = get().socket;
        if (existingSocket?.connected) return;
        if (existingSocket) {
            existingSocket.removeAllListeners();
            existingSocket.disconnect();
        }

        const socket = io(SOCKET_URL, {
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            timeout: 10000,
        });

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
            set({ isConnected: true });

            const currentChatId = get().currentChatId;
            if (currentChatId) {
                socket.emit("join-chat", currentChatId);
            }
        });

        socket.on("connect_error", (error) => {
            console.error("Socket connection error: ", error.message);
        });

        socket.on("socket-error", (error: { message: string }) => {
            console.error("Socket error:", error.message);
        });

        socket.on("disconnect", () => {
            console.error("Socket disconnected", socket.id);
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

        // Handles active chat message stream
        socket.on("new-message", (message: Message) => {
            const senderObject = message.sender as MessageSender;
            const { currentChatId } = get();

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

            // mark as unread if not currently viewing this chat and message from other user
            if (currentChatId !== message.chat) {
                const chats = queryClient.getQueryData<Chat[]>(chatsQueryKey(userId));
                const chat = chats?.find((c) => c._id === message.chat);
                if (chat?.participant && senderObject._id === chat.participant._id) {
                    set((state) => ({
                        unreadChats: new Set([...state.unreadChats, message.chat]),
                    }));
                }
            }

            // clear typing indicator when message received
            set((state) => {
                const typingUsers = new Map(state.typingUsers);
                typingUsers.delete(message.chat);
                return { typingUsers };
            });
        });

        // Event listener for real-time sidebar/chat list updates
        socket.on("chat-list-update", ({ chatId, lastMessage, lastMessageAt }: { chatId: string; lastMessage: Message; lastMessageAt: string }) => {
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
    },

    disconnect: () => {
        const socket = get().socket;
        if (socket) {
            socket.removeAllListeners(); // Remove all event listeners to prevent memory leaks
            socket.disconnect();
            set({
                socket: null,
                isConnected: false,
                onlineUsers: new Set(),
                typingUsers: new Map(),
                unreadChats: new Set(),
                currentChatId: null,
                queryClient: null,
            });
        }
    },

    joinChat: (chatId) => {
        const socket = get().socket;
        set((state) => {
            const unreadChats = new Set(state.unreadChats);
            unreadChats.delete(chatId);
            return { currentChatId: chatId, unreadChats };
        });

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
                    console.error("Failed to send message:", response?.error || "Unknown socket error");

                    // Revert optimistic message on error or timeout
                    queryClient.setQueryData<Message[]>(["messages", chatId], (old) => {
                        if (!old) return [];
                        return old.filter((msg) => msg._id !== tempId);
                    });
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