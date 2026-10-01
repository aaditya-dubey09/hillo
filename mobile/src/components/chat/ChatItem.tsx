import { useSocketStore } from '@/src/lib/socket';
import type { Chat } from '@/src/types';
import { formatTime } from "../../lib/utils";
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

const ChatItem = ({ chat, onPress }: { chat: Chat, onPress: () => void }) => {
    const participant = chat?.participant;
    const { onlineUsers, typingUsers } = useSocketStore();

    const unreadCount = chat?.unreadCount ?? 0;
    const hasUnread = unreadCount > 0;

    if (!chat) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-subtle-foreground">No chat or user data available.</Text>
            </View>
        )
    }

    const isOnline = onlineUsers.has(participant?._id || "");
    const isTyping = typingUsers.has(participant?._id || "");

    return (
        <Pressable
            className="flex-row items-center py-3 active:opacity-70 border-b border-b-surface-dark"
            onPress={onPress}
        >
            {/* avatar & online indicator */}
            <View className="relative">
                <Image
                    source={participant?.avatar}
                    style={{ width: 56, height: 56, borderRadius: 999 }}
                />
                {isOnline && (
                    <View className="absolute bottom-0 right-0 size-4 bg-green-500 rounded-full border-[3px] border-surface" />
                )}
            </View>

            {/* chat info */}
            <View className="flex-1 ml-4">
                <View className="flex-row items-center justify-between">
                    <Text className={`text-base font-medium ${hasUnread ? "text-primary" : "text-foreground"}`}>
                        {participant?.name}
                    </Text>

                    <View className="flex-row items-center gap-2">
                        <Text className="text-xs text-subtle-foreground">
                            {chat?.lastMessageAt ?
                                formatTime(new Date(chat.lastMessageAt)) : ""} {/* can be suffix true */}
                        </Text>
                        {hasUnread && (
                            <View className="min-w-5 h-5 rounded-full bg-primary px-1.5 items-center justify-center">
                                <Text className="text-[10px] font-semibold text-primary-content">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View className="flex-row items-center justify-between mt-1">
                    {isTyping ? (
                        <Text className="text-sm text-primary italic">typing...</Text>
                    ) : (
                        chat ? (<Text className={`text-sm flex-1 mr-3 ${hasUnread ? "text-foreground font-medium" : "text-subtle-foreground"}`}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {chat?.lastMessage?.text || "No messages yet"}
                        </Text>) : ("")
                    )}
                </View>
            </View>
        </Pressable>
    )
}

export default ChatItem;