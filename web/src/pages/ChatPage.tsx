import type { Chat, Message } from "@/types";
import { useClerk, UserButton } from "@clerk/react";
import { EllipsisVerticalIcon, LogOutIcon, MessageSquareIcon, MessageSquareText, PhoneCall, SearchIcon, Settings, UserPlus, VideoIcon } from "lucide-react";
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
import { useUsers } from "@/hooks/useUsers";

type FilterType = "All" | "Unread" | "New";

const ChatPage = () => {
    const { data: currentUser } = useCurrentUser();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeChatId = searchParams.get("chat");

    const [messageInput, setMessageInput] = useState("");
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    // Search and filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>("All");

    // Explicitly type ref elements and timeouts
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { socket, sendTyping, sendMessage } = useSocketStore(); // todo: fix: unreadChats now comes in chat response, so we don't need to destructure here from socket store anymore

    useSocketConnection(activeChatId);

    const { signOut } = useClerk();
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

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await signOut();
        } catch (error) {
            console.error("Failed to sign out:", error);
        } finally {
            setIsLoggingOut(false);
            setIsLogoutModalOpen(false);
        }
    };

    // filter and search Logic
    const filteredChats = useMemo(() => {
        return chats.filter((chat) => {
            const name = chat.participant?.name?.toLowerCase() || "Unknown";
            const email = chat.participant?.email?.toLowerCase() || "Unknown";
            const query = searchQuery.trim().toLowerCase();

            // search query match
            const matchesSearch = !query || name.includes(query) || email.includes(query);

            // filter ab match
            let matchesFilter = true;
            if (activeFilter === "Unread") {
                matchesFilter = (chat?.unreadCount ?? 0) > 0;
            } else if (activeFilter === "New") {
                // ex - chats created within the last 24 hours
                const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
                matchesFilter = new Date(chat.createdAt || 0).getTime() > dayAgo;
            }

            return matchesSearch && matchesFilter;
        });
    }, [chats, searchQuery, activeFilter]);

    return (
        <div className="h-screen bg-[#28282D] text-base-content flex">
            <div className="w-10 flex flex-col items-center justify-between border-r border-[#28282D] p-2">
                <div className="flex flex-col items-center gap-4 mt-3">
                    <MessageSquareText className="cursor-pointer text-white" />
                    <PhoneCall className="cursor-pointer text-[#888] active:text-white" />
                    <VideoIcon className="cursor-pointer text-[#888] active:text-white" />
                </div>
                <div className="flex flex-col items-center gap-4">
                    <UserButton />
                    <button onClick={() => console.log("Settings clicked")} title="Settings">
                        <Settings className="cursor-pointer text-[#888]" />
                    </button>
                    <button onClick={() => setIsLogoutModalOpen(true)} title="Logout">
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
                    {/* sidebar search */}
                    <div className="inline-flex items-center gap-2 bg-base-300/60 border-none rounded-full px-3 py-2 w-full">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="peer bg-transparent border-none placeholder:text-white/30 placeholder:pointer-events-none focus:placeholder:text-transparent placeholder:transition-colors placeholder:select-none outline-none ring-0 order-last w-full"
                            placeholder="Search..."
                        />
                        <SearchIcon className="peer-focus:hidden order-first size-5 text-white/30 pointer-events-none select-none transition" />
                    </div>
                    {/* filters */}
                    <div className="flex items-center gap-2 mt-4">
                        {(["All", "Unread", "New"] as FilterType[]).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`${activeFilter === filter
                                        ? "bg-[#38383D] text-base-content"
                                        : "bg-[#28282D] text-base-content/50"
                                    } text-xs rounded-full py-0.5 px-2 transition-colors cursor-pointer`}
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

                    {/* no conversations */}
                    {chats.length === 0 && !chatsLoading && <NoConversationsUI />}

                    {/* chat list item */}
                    <div className="flex flex-col gap-1">
                        {filteredChats.map((chat) => (
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
                                        <span className="bg-base-300 text-base-content/70 text-xs px-3 py-1 rounded-lg font-medium shadow-sm pointer-events-none select-none">
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
            <LogOutModal
                isLogoutModalOpen={isLogoutModalOpen}
                setIsLogoutModalOpen={setIsLogoutModalOpen}
                handleLogout={handleLogout}
                isLoggingOut={isLoggingOut}
            />
        </div >
    );
};

export default ChatPage;

// Helper UI Components
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

// todo: check if it looks and work fine on ui
function LogOutModal({
    isLogoutModalOpen,
    setIsLogoutModalOpen,
    handleLogout,
    isLoggingOut = false,
}: {
    isLogoutModalOpen: boolean;
    setIsLogoutModalOpen: (open: boolean) => void;
    handleLogout: () => void;
    isLoggingOut?: boolean;
}) {
    const dialogRef = useRef<HTMLDialogElement | null>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isLogoutModalOpen) {
            if (!dialog.open) {
                dialog.showModal();
            }
        } else {
            if (dialog.open) {
                dialog.close();
            }
        }
    }, [isLogoutModalOpen]);

    return (
        <dialog
            ref={dialogRef}
            onCancel={(e) => {
                e.preventDefault();
                setIsLogoutModalOpen(false);
            }}
            onClose={() => setIsLogoutModalOpen(false)}
            className="modal backdrop-blur-xs"
        >
            <div className="modal-box bg-[#212126] px-0 rounded-3xl">
                <div className="flex items-center justify-between border-b border-[#16161a] w-full px-4 pb-3 mb-2">
                    <h3 className="font-semibold text-white">Confirm Logout</h3>
                </div>

                <p className="px-4 py-2 text-sm text-base-content/70">
                    Are you sure you want to log out of your account?
                </p>

                <div className="modal-action px-4 pt-2 gap-2">
                    <button
                        type="button"
                        disabled={isLoggingOut}
                        className="btn btn-ghost btn-sm border-0 text-base-content/70 rounded-xl"
                        onClick={() => setIsLogoutModalOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={isLoggingOut}
                        className="btn btn-error btn-sm border-0 rounded-xl"
                        onClick={handleLogout}
                    >
                        {isLoggingOut ? (
                            <span className="loading loading-spinner loading-xs" />
                        ) : (
                            "Logout"
                        )}
                    </button>
                </div>
            </div>

            {/* Backdrop click handler */}
            <form method="dialog" className="modal-backdrop">
                <button type="submit" onClick={() => setIsLogoutModalOpen(false)}>
                    close
                </button>
            </form>
        </dialog>
    );
}