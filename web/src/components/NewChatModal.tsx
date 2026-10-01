import { SearchIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useUsers } from "../hooks/useUsers";
import { useSocketStore } from "../lib/socket";

export function NewChatModal({
    onStartChat,
    isPending,
    isOpen,
    onClose

}: {
    onStartChat: (participantId: string) => void;
    isPending: boolean;
    isOpen: boolean;
    onClose: () => void
}) {
    const { data: currentUser } = useCurrentUser();
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const { onlineUsers } = useSocketStore();
    const { data: allUsers = [] } = useUsers();

    const isOnline = (id: string) => onlineUsers.has(id);

    useEffect(() => {
        if (isOpen) {
            searchInputRef.current?.focus();
        }
    }, [isOpen]);


    if (!isOpen || !currentUser) return null;

    const handleStartChat = (participantId: string) => {
        onStartChat(participantId);
    }

    const handleClose = () => {
        setSearchQuery("");
        onClose();
    };

    const searchResults = allUsers.filter((u) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            u._id !== currentUser?._id &&
            (u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query))
        );
    });

    return (
        <dialog className={`modal bg-black/60 ${isOpen ? "modal-open" : ""}`}>
            <div className="modal-box bg-[#212126] px-0 rounded-3xl bg-gradient-to-t from-black/30 via-transparent to-transparent">
            {/* modal header */}
                <div className="modal-action mt-0 mb-4 gap-1 items-center justify-start border-b border-[#16161a] w-full px-4 pb-2">
                    <button
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-[#242428] cursor-pointer hover:bg-[#2D2D30] transition-colors duration-200"
                        aria-label="Close"
                        type="button"
                        onClick={handleClose}
                    >
                        <X className="size-4 text-[#F4A261]" />
                    </button>
                    <h3 className="font-semibold">
                        New Chat
                    </h3>
                </div>
                {/* search bar */}
                <div className="relative mb-4 px-4">
                    <div className="inline-flex items-center bg-[#242428] rounded-full px-3 py-0.5 w-full shadow-sm">
                        <input
                            type="text"
                            value={searchQuery}
                            ref={searchInputRef}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users by name or email..."
                            className="input peer bg-transparent border-none placeholder:text-[#888] outline-none ring-0 order-last w-full"
                            autoFocus={true}
                        />
                        <SearchIcon className="peer-focus:hidden order-first size-5 text-[#888] pointer-events-none" />
                    </div>
                </div>
                {/* search results or no results */}
                <div className="max-h-72 overflow-y-auto px-4">
                    {searchResults.length === 0 ? (
                        <div className="py-8 text-center text-base-content/60 text-sm">
                            {searchQuery ? "No users found" : "Start typing to search"}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {searchResults.map((u) => (
                                <button
                                    key={u._id}
                                    onClick={() => handleStartChat(u._id)}
                                    disabled={isPending}
                                    type="submit"
                                    className="flex items-center p-2 hover:bg-[#16161a]/60 active:opacity-90 rounded-lg cursor-pointer w-full normal-case transition-colors duration-200"
                                >
                                    <div className="relative">
                                        <img src={u.avatar} alt="" className="w-[48px] h-10 rounded-full" />
                                        {isOnline(u._id) && (
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-base-200" />
                                        )}
                                    </div>
                                    <div className="flex flex-col items-start w-full ml-3 border-b border-white/5 pb-2">
                                        <div className="flex items-center justify-between w-full">
                                            <p className="font-medium text-sm truncate">
                                                {u.name}
                                            </p>
                                            {isOnline(u._id) && <p className="text-xs text-[#F4A261] font-medium">Online</p>}
                                        </div>
                                        <p className="text-xs text-base-content/70 mt-0.5">{u.email}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div
                className="modal-backdrop"
                onClick={handleClose}
            />
        </dialog>
    )
}
