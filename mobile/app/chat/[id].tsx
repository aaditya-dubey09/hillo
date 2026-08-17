import MessageBubble from '@/src/components/chat/MessageBubble';
import EmptyUI from '@/src/components/common/EmptyUI';
import { useCurrentUser } from '@/src/hooks/useAuth';
import { useMessages } from '@/src/hooks/useMessages';
import { useSocketStore } from '@/src/lib/socket';
import { MessageSender } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ChatParams = {
    id: string;
    participantId: string;
    name: string;
    avatar: string;
};

const ChatDetailScreen = () => {
    const { id: chatId, participantId, name, avatar } = useLocalSearchParams<ChatParams>();
    const [messageText, setMessageText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const { data: currentUser } = useCurrentUser();
    const { data: messages, isLoading } = useMessages(chatId);

    const { joinChat, leaveChat, sendMessage, sendTyping, isConnected, onlineUsers, typingUsers } = useSocketStore();

    const isOnline = participantId ? onlineUsers.has(participantId) : false;
    const isTyping = typingUsers.get(chatId) === participantId;

    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // join chat room on mount, leave on unmount
    useEffect(() => {
        if (chatId && isConnected) joinChat(chatId);

        return () => {
            if (chatId) leaveChat(chatId);
        };
    }, [chatId, isConnected, joinChat, leaveChat]);

    // scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages && messages.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleTyping = useCallback((text: string) => {
        setMessageText(text);

        if (!isConnected || !chatId) return;

        // send typing start
        if (text.length > 0) {
            sendTyping(chatId, true);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
                sendTyping(chatId, false);
            }, 2000);
        } else {
            // text cleared, stop typing
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            sendTyping(chatId, false);
        }
    }, [chatId, isConnected, sendTyping]);

    const handleSend = () => {
        if (!messageText.trim() || isSending || !isConnected || !currentUser) return;

        // send typing indicator
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        sendTyping(chatId, false);
        setIsSending(true);
        sendMessage(chatId, messageText.trim(), {
            _id: currentUser._id,
            name: currentUser.name,
            email: currentUser.email,
            avatar: currentUser.avatar,
        });
        setMessageText("");
        setIsSending(false);

        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
            {/* Header */}
            <View className="flex-row items-center px-4 py-2 bg-surface border-b border-surface-light">
                <Pressable onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#F4A261" />
                </Pressable>
                <View className="flex-row items-center flex-1 ml-2">
                    {avatar && <Image source={avatar} style={{ width: 40, height: 40, borderRadius: 999 }} />}
                    <View className="ml-3">
                        <Text
                            className="text-foreground font-semibold text-base"
                            numberOfLines={1}
                        >
                            {name}
                        </Text>
                        <Text className={`text-xs ${isTyping ? "text-primary" : "text-muted-foreground"}`}>
                            {isTyping ? "typping..." : isOnline ? "Online" : "Offline"}
                        </Text>
                    </View>
                </View>
                <View className="flex-row items-center gap-3">
                    <Pressable className="w-9 h-9 rounded-full items-center justify-center">
                        <Ionicons name="call-outline" size={20} color="#A0A0A5" />
                    </Pressable>
                    <Pressable className="w-9 h-9 rounded-full items-center justify-center">
                        <Ionicons name="videocam-outline" size={20} color="#A0A0A5" />
                    </Pressable>
                </View>
            </View>

            {/* Messages + Input */}
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={0}
            >
                <View className="flex-1 bg-surface">
                    {isLoading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="#F4A261" />
                        </View>
                    ) : !messages || messages.length === 0 ? (
                        <EmptyUI
                            title="No messages yet"
                            subtitle="Start the conversation!"
                            iconName="chatbubbles-outline"
                            iconColor="#6B6B70"
                            iconSize={64}
                        />
                    ) : (
                        <ScrollView
                            ref={scrollViewRef}
                            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
                            onContentSizeChange={() => {
                                scrollViewRef.current?.scrollToEnd({ animated: false })
                            }}
                        >
                            {messages.map((message) => {
                                const senderId = (message.sender as MessageSender)._id;
                                const isFromMe = currentUser ? senderId === currentUser._id : false;

                                return <MessageBubble key={message._id} message={message} isFromMe={isFromMe} />
                            })}
                        </ScrollView>
                    )}

                    {/* Input bar */}
                    <View className="px-2 pb-3 pt-2 bg-black/5 flex-row justify-between gap-2">
                        <View className="flex-row items-end bg-surface-card rounded-3xl flex-1 px-2 py-0.5 gap-2">
                            <Pressable className="w-10 h-10 rounded-full items-center justify-center">
                                <Ionicons name="happy-outline" size={22} color="#6B6B70" />
                            </Pressable>

                            <TextInput
                                placeholder="Type a message"
                                placeholderTextColor="#6B6B70"
                                className="flex-1 text-foreground text-sm"
                                multiline
                                style={{ maxHeight: 100 }}
                                value={messageText}
                                onChangeText={handleTyping}
                                onSubmitEditing={handleSend}
                                editable={!isSending}
                            />

                            <Pressable className="w-10 h-10 rounded-full items-center justify-center">
                                <Ionicons name="attach" size={22} color="#6B6B70" />
                            </Pressable>
                        </View>
                            <Pressable
                                className="w-10 h-10 rounded-full items-center justify-center bg-primary"
                                onPress={handleSend}
                                disabled={!messageText.trim() || isSending}
                            >
                                {isSending ? (
                                    <ActivityIndicator size="small" color="#0D0D0F" />
                                ) : (
                                    <Ionicons name="send" size={16} color="#0D0D0F" />
                                )}
                            </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default ChatDetailScreen;