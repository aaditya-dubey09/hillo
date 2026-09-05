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
    participant: MessageSender;
    lastMessage: ChatLastMessage;
    lastMessageAt: string;
    createdAt: string;
}