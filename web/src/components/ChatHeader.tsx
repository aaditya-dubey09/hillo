import type { MessageSender } from "../types";
import { useSocketStore } from "../lib/socket";

interface ChatHeaderProps {
    participant?: MessageSender;
    chatId: string;
}

export function ChatHeader ({ participant, chatId }: ChatHeaderProps) {
    const { onlineUsers, typingUsers } = useSocketStore();
    const isOnline = onlineUsers.has(participant?._id ?? "");
    const typingUserId = typingUsers.get(chatId);
    const isTyping = typingUserId && typingUserId === participant?._id;

    return (
        <div className="h-16 px-6 border-b border-[#212126] flex items-center gap-4 bg-[#212126]">
            <div className="relative">
                <img
                    src={participant?.avatar}
                    className="w-10 h-10 rounded-full bg-[#212126]/40"
                    alt=""
                />
                {isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-[#212126]" />
                )}
            </div>
            <div>
                <h2 className="font-semibold">{participant?.name || "Unknown User"}</h2>
                <p className="text-xs text-base-content/70">
                    {isTyping ? "typing..." : isOnline ? "Online" : "Offline"}
                </p>
            </div>
        </div>
    )
}
