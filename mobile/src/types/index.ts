export interface User {
    _id: string;
    name: string;
    email: string;
    avatar: string;
}

export interface MessageSender {
    _id: string;
    name: string;
    email: string;
    avatar: string;
}

export interface Message {
    _id: string;
    chat: string;
    sender: MessageSender;
    text: string;
    createdAt: string;
    updatedAt: string;
}

export interface ChatLastMessage {
    _id: string;
    text: string;
    sender: MessageSender;
    createdAt: string;
}

export interface Chat {
    _id: string;
    participant?: MessageSender;
    participants: MessageSender[];
    lastMessage?: ChatLastMessage | null; // Nullable for newly created chats without messages
    lastMessageAt: string;
    unreadCount?: number;
    createdAt: string;
}