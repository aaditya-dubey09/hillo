import type { Chat, Message } from "@/types";
import { UserButton } from "@clerk/react";
import { EllipsisVerticalIcon, LogOutIcon, MessageSquareIcon, MessageSquareText, PhoneCall, PlusIcon, SearchIcon, Settings, SparklesIcon, UserPlus, VideoIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { ChatHeader } from "../components/ChatHeader";
import { ChatInput } from "../components/ChatInput";
import { ChatListItem } from "../components/ChatListItem";
import { MessageBubble } from "../components/MessageBubble";
import { NewChatModal } from "../components/NewChatModal";
import { useChats, useGetOrCreateChat } from "../hooks/useChats";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useMessages } from "../hooks/useMessages";
import { useSocketConnection } from "../hooks/useSocketConnection";
import { useSocketStore } from "../lib/socket";
import { groupMessagesByDate } from "../lib/utils";

const ChatPage = () => {
    const { data: currentUser } = useCurrentUser();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeChatId = searchParams.get("chat");

    const [messageInput, setMessageInput] = useState("");
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

    // Explicitly type ref elements and timeouts
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { socket, sendTyping, sendMessage } = useSocketStore();

    useSocketConnection(activeChatId);

    const { data: chats = [], isLoading: chatsLoading } = useChats();
    const { data: messages = [], isLoading: messagesLoading } = useMessages(activeChatId ?? undefined);
    const startChatMutation = useGetOrCreateChat();
    const groupedMsgs = useMemo(() => {
        return groupMessagesByDate(messages);
    }, [messages]);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                if (activeChatId) sendTyping(activeChatId, false);
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
        };
    }, [activeChatId])

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChatId, messages]);

    const handleStartChat = (participantId: string) => {
        startChatMutation.mutate(participantId, {
            onSuccess: (chat: Chat) => {
                setSearchParams({ chat: chat._id });
                setIsNewChatModalOpen(false);
            },
        });
    };

    const handleSend = (e: SubmitEvent | React.SyntheticEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeChatId || !socket || !currentUser) return;

        const text = messageInput.trim();
        sendMessage(activeChatId, text, currentUser);
        setMessageInput("");
        sendTyping(activeChatId, false);
    };

    const handleTyping = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setMessageInput(e.target.value);
        if (!activeChatId || !socket) return;

        sendTyping(activeChatId, true);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            sendTyping(activeChatId, false);
        }, 2000);
    };

    const activeChat = chats.find((c) => c._id === activeChatId);

    const SignOutHandler = () => {
        // confirm sign out with a dialog box and if confirmed, sign out the user
    }

    return (
        <div className="h-screen bg-[#28282D] text-base-content flex">
            <div className="w-10 flex flex-col items-center justify-between border-r border-[#28282D] p-2">
                <div className="flex flex-col items-center gap-4 mt-3">
                    <MessageSquareText className="cursor-pointer text-white" />
                    <button onClick={() => console.log("Phone call clicked")}>
                        <PhoneCall className="cursor-pointer text-[#888]" />
                    </button>
                    <button onClick={() => console.log("Video call clicked")}>
                        <VideoIcon className="cursor-pointer text-[#888]" />
                    </button>
                </div>
                <div className="flex flex-col items-center gap-4">
                    <UserButton />
                    <button onClick={() => console.log("Settings clicked")}>
                        <Settings className="cursor-pointer text-[#888]" />
                    </button>
                    <button onClick={() => SignOutHandler()}>
                        <LogOutIcon className="cursor-pointer text-[#888]" />
                    </button>
                </div>
            </div>
            {/* sidebar */}
            <div className="w-80 flex flex-col bg-[#212126] border-r border-[#28282D]">
                {/* header */}
                <div className="p-4 border-b border-[#28282D]">
                    <div className="flex items-center justify-between mb-4">
                        <Link to="/chat" className="flex items-center gap-2">
                            <span className="font-bold">Hillo</span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsNewChatModalOpen(true)}
                                className="border-none cursor-pointer"
                            >
                                <UserPlus className="size-4" />
                            </button>
                            <EllipsisVerticalIcon className="size-5 cursor-pointer" />
                        </div>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-transparent border border-[#888] rounded-full px-3 py-1 w-full">
                        <input
                            className="peer bg-transparent border-none placeholder:text-[#888] outline-none ring-0 order-last w-full"
                            placeholder="Search..."
                        />
                        <SearchIcon className="peer-focus:hidden order-first size-5 text-[#888]" />
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        {["All", "Unread", "Groups", "New"].map((filter) => (
                            <button
                                key={filter}
                                className={`${filter === 'All' ? 'bg-[#38383D] text-base-content' : 'bg-[#28282D] text-base-content/50'} text-xs bg-[#28282D] rounded-full py-0.5 px-2 transition-colors cursor-pointer`}
                            >
                                <span>{filter}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* chat list */}
                <div className="flex-1 overflow-y-auto">
                    {chatsLoading && (
                        <div className="flex items-center justify-center py-8">
                            <span className="loading loading-spinner loading-sm text-amber-400" />
                        </div>
                    )}

                    {chats.length === 0 && !chatsLoading && <NoConversationsUI />}

                    <div className="flex flex-col gap-1">
                        {chats.map((chat) => (
                            <ChatListItem
                                key={chat._id}
                                chat={chat}
                                isActive={activeChatId === chat._id}
                                onClick={() => setSearchParams({ chat: chat._id })}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* main chat area */}
            <div className="flex flex-col flex-1">
                {activeChatId && activeChat ? (
                    <>
                        <ChatHeader
                            participant={activeChat.participant}
                            chatId={activeChatId}
                        />

                        {/* messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messagesLoading && (
                                <div className="flex items-center justify-center h-full">
                                    <span className="loading loading-spinner loading-md text-amber-400" />
                                </div>
                            )}

                            {messages.length === 0 && !messagesLoading && <NoMessagesUI />}

                            {messages.length > 0 && (
                                Object.entries(groupedMsgs).flatMap(([dateHeader, messagesInGroup]) => [
                                    <div key={`header-${dateHeader}`} className="flex justify-center my-4 w-full">
                                        <span className="bg-base-300 text-base-content/70 text-xs px-3 py-1 rounded-lg font-medium shadow-sm">
                                            {dateHeader}
                                        </span>
                                    </div>,
                                    ...messagesInGroup.map((msg: Message) => (<MessageBubble
                                        key={msg._id}
                                        message={msg}
                                        currentUser={currentUser}
                                    />))
                                ])
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        <ChatInput
                            value={messageInput}
                            onChange={handleTyping}
                            onSubmit={handleSend}
                            disabled={!messageInput.trim() || !socket || !currentUser}
                        />
                    </>
                ) : <NoChatsSelectedUI />}
            </div>
            <NewChatModal
                onStartChat={handleStartChat}
                isPending={startChatMutation.isPending}
                isOpen={isNewChatModalOpen}
                onClose={() => setIsNewChatModalOpen(false)}
            />
        </div >
    );
};

export default ChatPage;

function NoConversationsUI() {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquareIcon className="w-10 h-10 text-amber-400 mb-3" />
            <p className="text-base-content/70 text-sm">No conversations yet</p>
            <p className="text-base-content/60 text-xs mt-1">Start a new chat to begin</p>
        </div>
    )
}

function NoMessagesUI() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-base-300/40 flex items-center justify-center mb-4">
                <MessageSquareIcon className="w-8 h-8 text-base-content/20" />
            </div>
            <p className="text-base-content/70">No messages yet</p>
            <p className="text-base-content/60 text-sm mt-1">Send a message to start the conversation</p>
        </div>
    )
}

function NoChatsSelectedUI() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 rounded-3xl bg-linear-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6">
                <MessageSquareIcon className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome to Hillo</h2>
            <p className="text-base-content/70 max-w-sm">
                Select a conversation from the sidebar or start a new chat to begin messaging
            </p>
        </div>
    )
}