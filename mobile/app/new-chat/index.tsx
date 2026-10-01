import UserItem from '@/src/components/UserItem';
import { useStartChat } from '@/src/hooks/useStartChat';
import { useUsers } from '@/src/hooks/useUsers';
import { useSocketStore } from '@/src/lib/socket';
import type { User } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NewChatScreen = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const router = useRouter();

    const { data: allUsers, isLoading, isError, error, refetch } = useUsers();
    const { openChat, isCreatingChat, isChatError, chatError } = useStartChat();
    const { onlineUsers } = useSocketStore();

    // client-side filtering
    const users = allUsers?.filter((u) => {
        if (!searchQuery.trim()) return true; // If search query is empty, return all users
        const query = searchQuery.toLowerCase();
        return u.name.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query);
    });

    const handleUserSelect = (user: User) => {
        openChat({ user }, () => router.dismiss());
    };

    return (
        <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
            <View className="flex-1 bg-black/40 justify-end">
                <View className="bg-surface rounded-t-3xl h-[95%] overflow-hidden">

                    <View className="px-5 pt-3 pb-3 bg-surface border-b border-surface-light flex-row items-center">
                        <Pressable
                            className="w-9 h-9 rounded-full items-center justify-center mr-2 bg-surface-card"
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                            onPress={() => router.back()}
                        >
                            <Ionicons name="close" size={20} color="#F4A261" />
                        </Pressable>

                        <View className="flex-1">
                            <Text className="text-foreground text-xl font-semibold">New Chat</Text>
                            <Text className="text-muted-foreground text-xs mt-0.5">Search for a user to start chatting</Text>
                        </View>
                    </View>

                    {/* Search bar */}
                    <View className="relative mb-4 px-4 pt-3 pb-2">
                        <View className="flex-row items-center bg-surface-card rounded-full px-3 py-0.5 border border-surface-light w-full">
                            {!isFocused && (
                                <Ionicons name="search" size={18} color="#6B6B70" />
                            )}
                            <TextInput
                                placeholder="Search users by name or email..."
                                placeholderTextColor="#6B6B70"
                                className="text-foreground text-sm bg-transparent flex-1 border-none placeholder:text-[#888] outline-none ring-0"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                                autoFocus={true}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                            />
                        </View>

                        {/* Error state for chat creation - below search bar */}
                        {isChatError && (
                            <View className="px-3 pt-4">
                                <Text className="text-red-400 text-xs">
                                    {chatError?.message || "Failed to initiate chat. Please try again."}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* User list */}
                    <View className="flex-1 bg-surface">
                        {isCreatingChat || isLoading ? (
                            <View className="flex-1 items-center justify-center">
                                <ActivityIndicator size="large" color="#F4A261" />
                            </View>
                        ) : isError ? (
                            /* Retry View for useUsers error */
                            <View className="flex-1 items-center justify-center px-5">
                                <Ionicons name="alert-circle-outline" size={56} color="#E76F51" />
                                <Text className="text-foreground text-base font-medium mt-3">
                                    {error?.message || "Failed to load users"}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => refetch()}
                                    className="mt-4 px-5 py-2 bg-surface-card border border-surface-light rounded-full"
                                >
                                    <Text className="text-foreground text-sm font-semibold">Retry</Text>
                                </TouchableOpacity>
                            </View>
                        ) : !users || users.length === 0 ? (
                            <View className="flex-1 items-center justify-center px-5">
                                <Ionicons name="person-outline" size={64} color="#6B6B70" />
                                <Text className="text-muted-foreground text-lg mt-4">No user found</Text>
                                <Text className="text-subtle-foreground text-sm mt-1 text-center">Try a different search term</Text>
                            </View>
                        ) : (
                            <ScrollView
                                className="flex-1 px-5"
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 24 }}
                                keyboardShouldPersistTaps="handled"
                            >
                                <Text className="text-muted-foreground text-xs mb-3">USERS</Text>
                                {users.map(user => (
                                    <UserItem
                                        key={user._id}
                                        user={user}
                                        isOnline={onlineUsers.has(user._id)}
                                        onPress={() => handleUserSelect(user)}
                                    />
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default NewChatScreen;