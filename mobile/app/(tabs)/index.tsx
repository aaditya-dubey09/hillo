import { useRouter } from 'expo-router';
import { useChats } from '@/src/hooks/useChats';
import React, { useMemo } from 'react';
import { ActivityIndicator, View, Text, FlatList, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import ChatItem from '@/src/components/chat/ChatItem';
import EmptyUI from '@/src/components/common/EmptyUI';
import type { Chat } from '@/src/types';

type FilterType = "All" | "Unread" | "New";
const ChatTab = () => {
    const router = useRouter();
    const { data: chats = [], isLoading, error, refetch, isRefetching } = useChats();
    const [searchQuery, setSearchQuery] = React.useState("");
    const [activeFilter, setActiveFilter] = React.useState<FilterType>("All");

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

    // Dynamic Empty State Props
    const emptyStateProps = useMemo(() => {
        if (chats.length === 0) {
            return {
                title: "No chats yet",
                subtitle: "Start a conversation!",
                buttonLabel: "New Chat",
                onPressButton: () => router.push("/new-chat"),
            };
        }

        if (searchQuery.trim()) {
            return {
                title: "No results found",
                subtitle: `No conversations matching "${searchQuery.trim()}"`,
                buttonLabel: undefined,
                onPressButton: undefined,
            };
        }

        if (activeFilter === "Unread") {
            return {
                title: "No unread messages",
                subtitle: "You're all caught up!",
                buttonLabel: undefined,
                onPressButton: undefined,
            };
        }

        if (activeFilter === "New") {
            return {
                title: "No new chats",
                subtitle: "No conversations started in the last 24 hours.",
                buttonLabel: undefined,
                onPressButton: undefined,
            };
        }

        return {
            title: "No chats found",
            subtitle: "Try resetting your filter.",
            buttonLabel: undefined,
            onPressButton: undefined,
        };
    }, [chats.length, searchQuery, activeFilter, router]);

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-surface items-center justify-center">
                <ActivityIndicator size={"large"} color={"#F4A261"} />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-surface items-center justify-center">
                <View className="flex-col items-center justify-center bg-[#0D0D0F] px-6 py-8 rounded-3xl shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    <Text className="text-red-500 text-xl">Failed to load chats.</Text>
                    <Pressable
                        onPress={() => refetch()}
                        disabled={isRefetching}
                        className={`mt-4 px-4 py-2 rounded-lg active:bg-primary/70 ${isRefetching ? 'bg-primary/70' : 'bg-primary/90'}`}
                    >
                        <Text style={{ color: "#0D0D0F", fontWeight: "bold" }}>
                            {isRefetching ? 'Retrying...' : 'Retry'}
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const handleChatPress = (chat: Chat) => {
        if (!chat.participant) {
            return;
        }

        router.push({
            pathname: "/chat/[id]",
            params: {
                id: chat._id,
                participantId: chat.participant._id,
                name: chat.participant.name,
                avatar: chat.participant.avatar,
            },
        });
    };

    return (
        <SafeAreaView className="flex-1 relative bg-surface-dark" edges={["top", "bottom"]}>
            <FlatList
                data={filteredChats}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <View className="px-4 bg-surface">
                        <ChatItem chat={item} onPress={() => handleChatPress(item)} />
                    </View>
                )}
                showsVerticalScrollIndicator={false}
                contentInsetAdjustmentBehavior="automatic"
                ListHeaderComponent={
                    <Header
                        activeFilter={activeFilter}
                        setActiveFilter={setActiveFilter}
                    />}
                ListEmptyComponent={
                    <EmptyUI
                        title={emptyStateProps.title}
                        subtitle={emptyStateProps.subtitle}
                        iconName="chatbubbles-outline"
                        iconColor="#6B6B70"
                        iconSize={64}
                        buttonLabel={emptyStateProps.buttonLabel}
                        onPressButton={emptyStateProps.onPressButton}
                    />
                }
            />

            <Pressable
                className="size-10 bg-primary absolute bottom-4 right-4 rounded-full items-center justify-center"
                onPress={() => router.push("/new-chat")}
            >
                <Feather name="user-plus" size={20} color="#0D0D0F" />
            </Pressable>
        </SafeAreaView>
    );
};

export default ChatTab;

type HeaderProps = {
    activeFilter: FilterType;
    setActiveFilter: (filter: FilterType) => void;
};

function Header({ activeFilter, setActiveFilter }: HeaderProps) {
    const router = useRouter();

    return (
        <View>
            <View className="flex-row items-center justify-between px-4 pt-4">
                <Text className="text-2xl font-bold text-primary font-serif tracking-wider">Hillo</Text>
                <Ionicons name="ellipsis-vertical" size={18} color="#6B6B70" />
            </View>
                <Pressable className="px-4 mt-4" onPress={() => router.push("/search")}>
                    <View className="flex-row items-center gap-2 px-3 py-2 bg-surface rounded-full">
                        <Ionicons name="search" size={18} color="#6B6B70" />
                        <Text className="text-muted-foreground">Search...</Text>
                    </View>
                </Pressable>

            <View className="relative mt-2">
                {/* Filters */}
                <View className="flex-row items-center gap-2 mt-4 px-4 bg-surface-dark">
                    {(["All", "Unread", "New"] as FilterType[]).map((filter) => {
                        const isActive = activeFilter === filter;
                        return (
                            <Pressable
                                key={filter}
                                onPress={() => setActiveFilter(filter)}
                                className={`px-3 py-2 border ${isActive
                                    ? "bg-surface border-0 rounded-t-xl"
                                    : "bg-transparent border-0"
                                    }`}
                            >
                                <Text
                                    className={`text-xs font-semibold ${isActive
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                        }`}
                                >
                                    {filter}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}