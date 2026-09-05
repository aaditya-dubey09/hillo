import type { Message } from "@/types";
import { CheckCheck } from "lucide-react";

export function MessageBubble({ message, currentUser }: { message: Message; currentUser: any }) {
    const isMe = message.sender?._id === currentUser?._id;
    const time = message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' }) : "";

    return (
        <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-md px-2 py-2 rounded-b-xl ${isMe
                ? "bg-linear-to-r from-amber-500 to-orange-500 text-primary-content rounded-l-xl"
                : "bg-base-300/40 text-base-content rounded-r-xl"}`}
            >
                <p className="text-sm">{message.text}</p>
                <div className={`text-[10px] text-right mt-1 ${isMe ? "text-primary-content/80" : "text-base-content/70"}`}>
                    <span className={`${isMe ? "inline-flex gap-1" : ""}`}>{time}
                    {isMe &&
                        <CheckCheck size={14} className="opacity-70" />
                    }</span>
                </div>
            </div>
        </div>
    )
}
