import { formatTime } from "../lib/utils";
import { useSocketStore } from "../lib/socket";
import type { Chat } from "../types";

export function ChatListItem({ chat, isActive, onClick }: { chat: Chat, isActive: boolean, onClick: () => void }) {
    const { onlineUsers, typingUsers } = useSocketStore();
    const isOnline = onlineUsers.has(chat.participant?._id ?? "");
    const isTyping = !!typingUsers.get(chat._id);

    return (
        <button
        onClick={onClick}
        className={`btn btn-ghost hover:bg-[#28282D] border-0 rounded-none ring-0 justify-start gap-3 px-4 py-8 w-full normal-case ${isActive ? "bg-[#28282D]" : ""}`}
        >
            <div className="relative">
                <img
                    src={chat.participant?.avatar}
                    className="w-11 h-11 rounded-full bg-[#28282D]/40" />
                {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-[#28282D]" />
                )}
            </div>
            <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">
                        {chat.participant?.name || "Unknown"}
                    </span>
                    {chat.lastMessageAt && (
                        <span className="text-xs text-base-content/60">{formatTime(chat.lastMessageAt)}</span>
                    )}
                </div>
                <p className="text-xs text-base-content/70 truncate mt-0.5">
                    {isTyping ? "typing..." : chat.lastMessage?.text || "No messages yet"}
                </p>
            </div>
        </button>
    )
}