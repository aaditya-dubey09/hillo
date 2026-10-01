import ChatItem from "@/src/components/chat/ChatItem";
import EmptyUI from "@/src/components/common/EmptyUI";
import UserItem from "@/src/components/UserItem";
import { useChats } from "@/src/hooks/useChats";
import { useStartChat } from "@/src/hooks/useStartChat";
import { useUsers } from "@/src/hooks/useUsers";
import { useSocketStore } from "@/src/lib/socket";
import type { Chat, User } from "@/src/types";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

type SearchTabType = "Users" | "Chats";

const SearchPage = () => {
    const { data: allUsers = [], isLoading: isUsersLoading, isError: isUsersError, error: userError, refetch: refetchUsers } = useUsers();
    const { data: allChats = [], isLoading: isChatsLoading, isError: isChatsError, error: chatError, refetch: refetchChats, isRefetching } = useChats();

    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<SearchTabType>("Users");
    const router = useRouter();
    const { openChat, isCreatingChat } = useStartChat();

    const query = searchQuery.trim().toLowerCase();
    const { onlineUsers } = useSocketStore();

    // filter all users
    const filteredUsers = useMemo(() => {
        if (!allUsers || !Array.isArray(allUsers)) return [];
        if (!query) return allUsers;

        return allUsers.filter((user: User) => {
            const name = user.name?.toLowerCase() || "";
            const email = user.email?.toLowerCase() || "";
            return name.includes(query) || email.includes(query);
        });
    }, [allUsers, query]);

    // filter chats
    const filteredChats = useMemo(() => {
        if (!allChats || !Array.isArray(allChats)) return [];
        if (!query) return allChats;

        return allChats.filter((chat: Chat) => {
            const name = chat.participant?.name?.toLowerCase() || "";
            const email = chat.participant?.email?.toLowerCase() || "";
            return name.includes(query) || email.includes(query);
        });
    }, [allChats, query]);

    // Loading state
    if (isUsersLoading || isChatsLoading || isCreatingChat) {
        return (
            <SafeAreaView className="flex-1 bg-surface items-center justify-center">
                <ActivityIndicator size={"large"} color={"#F4A261"} />
            </SafeAreaView>
        );
    }

    // Error state
    if (isUsersError || isChatsError) {
        const isUserError = !!userError;
        const errorMessage = isUserError ? userError?.message || "Failed to load users" : chatError?.message || "Failed to load chats";
        return (
            <SafeAreaView className="flex-1 bg-surface items-center justify-center">
                <View className="flex-col items-center justify-center bg-[#0D0D0F] px-6 py-8 rounded-3xl shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    <Text className="text-red-500 text-xl">{errorMessage}</Text>
                    <Pressable
                        onPress={() => isUserError ? refetchUsers() : refetchChats()}
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

    const handleUserSelect = (user: User) => {
        openChat({ user }, () => router.dismiss());
    };

    return (
        <SafeAreaView className="flex-1 bg-surface-dark" edges={["top", "bottom"]}>
            <View className="flex-row items-center px-3 py-2 border-b border-surface-light bg-surface-dark">
                <Pressable
                    onPress={() => router.back()}
                    className="p-1 mr-2 rounded-full active:bg-surface-light"
                >
                    <Ionicons name="arrow-back" size={22} color="#6B6B70" />
                </Pressable>

                <TextInput
                    placeholder={activeTab === "Users" ? "Search users by name/email..." : "Search active chats..."}
                    placeholderTextColor="#6B6B70"
                    className="text-foreground text-base flex-1 py-1 px-1"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoComplete="off"
                    autoFocus={true}
                    returnKeyType="search"
                />

                {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery("")} className="p-1">
                        <Ionicons name="close" size={20} color="#6B6B70" />
                    </Pressable>
                )}
            </View>

            <View className="flex-row items-center border-b border-surface-light bg-surface-dark px-2">
                {(["Users", "Chats"] as SearchTabType[]).map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <Pressable
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            className={`flex-1 items-center py-3 border-0 ${isActive ? "bg-primary/20" : "border-transparent"
                                } rounded-full`}
                        >
                            <Text
                                className={`text-xs font-semibold ${isActive ? "text-primary" : "text-muted-foreground"
                                    }`}
                            >
                                {tab === "Users" ? "Global search" : "Chats"}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* List based on active tab */}
            {activeTab === "Users" ? (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <View className="px-4 bg-surface-dark">
                            <UserItem
                                user={item}
                                isOnline={onlineUsers.has(item._id)}
                                hasBorder={false}
                                onPress={() => handleUserSelect(item)}
                                size="medium"
                            />
                        </View>
                    )}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <EmptyUI
                            title={searchQuery ? "No users found" : "Search users"}
                            subtitle={searchQuery ? "Try searching for someone else" : "Start typing to search users"}
                            iconName="search-outline"
                            iconColor="#6B6B70"
                            iconSize={56}
                        />
                    }
                />
            ) : (
                <FlatList
                    data={filteredChats}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <View className="px-4 bg-surface-dark">
                            <ChatItem
                                chat={item}
                                onPress={() => openChat({ chat: item }, () => router.dismiss())}
                            />
                        </View>
                    )}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <EmptyUI
                            title={searchQuery ? "No chats found" : "No active chats"}
                            subtitle={searchQuery ? "No conversations match your query" : "Search existing conversations"}
                            iconName="chatbubbles-outline"
                            iconColor="#6B6B70"
                            iconSize={56}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default SearchPage;