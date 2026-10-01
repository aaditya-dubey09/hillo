import { formatTime } from "../lib/utils";
import { useSocketStore } from "../lib/socket";
import type { Chat } from "../types";

export function ChatListItem({ chat, isActive, onClick }: { chat: Chat, isActive: boolean, onClick: () => void }) {
    const { onlineUsers, typingUsers } = useSocketStore();
    const isOnline = onlineUsers.has(chat.participant?._id ?? "");
    const isTyping = !!typingUsers.get(chat._id);
    const unreadCount = chat.unreadCount ?? 0;
    const hasUnread = unreadCount > 0;

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
                    <span className={`text-sm truncate font-medium ${hasUnread ? "text-[#F4A261]" : "text-white"}`} >
                        {chat.participant?.name || "Unknown"}
                    </span>
                    <div className="flex flex-col items-end gap-1 min-w-fit">
                        <span className="text-xs text-base-content/60 whitespace-nowrap">
                            {chat.lastMessageAt && formatTime(chat.lastMessageAt)}
                        </span>
                        {hasUnread && (
                            <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-[#F4A261] px-1.5 text-[10px] font-semibold leading-none text-[#212126]">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </div>
                </div>
                <p className={`text-xs truncate mt-0.5 ${isTyping ? "text-[#F4A261]" : "text-base-content/70"}`}>
                    {isTyping ? "typing..." : chat.lastMessage?.text || "No messages yet"}
                </p>
            </div>
        </button>
    )
}