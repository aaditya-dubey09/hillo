import { useRouter } from 'expo-router';
import { useChats } from '@/hooks/useChats';
import React from 'react';
import { ActivityIndicator, View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ChatItem from '@/components/ChatItem';
import EmptyUI from '@/components/EmptyUI';
import { Chat } from '@/types';

const ChatTab = () => {
    const router = useRouter();
    const { data: chats, isLoading, error, refetch, isRefetching } = useChats();

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
                        // todo: fix this styling
                        style={({ pressed }) => [
                            "mt-4 px-4 py-2 bg-primary/90 rounded-lg",
                            (pressed || isRefetching) && "bg-primary/70",
                        ]}
                    >
                        <Text style={{ color: "#0D0D0F", fontWeight: "bold" }}>
                            {isRefetching ? 'Retrying...' : 'Retry'}
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    // todo: have to test this
    const handleChatPress = (chat: Chat) => {
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
        <SafeAreaView className="flex-1 bg-surface">
            <FlatList
                data={chats}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <ChatItem chat={item} onPress={() => handleChatPress(item)} />}
                showsVerticalScrollIndicator={false}
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingTop: 16,
                    paddingBottom: 24,
                }}
                ListHeaderComponent={<Header />}
                ListEmptyComponent={<EmptyUI
                    title="No chats yet"
                    subtitle="Start a conversation!"
                    iconName="chatbubbles-outline"
                    iconColor="#6B6B70"
                    iconSize={64}
                    buttonLabel="New Chat"
                    // todo: update this to navigate to the new chat screen when implemented
                    onPressButton={() => console.log("pressed")}
                />}
            />
        </SafeAreaView>
    );
};

export default ChatTab;

function Header() {
    const router = useRouter();

    return (
        <View className="px-5 pt-2 pb-4">
            <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-foreground">Chats</Text>
                <Pressable
                    className="size-10 bg-primary rounded-full items-center justify-center"
                // todo: update this to navigate to the new chat screen when implemented
                // onPress={() => router.push("/new-chat")}
                >
                    <Ionicons name="create-outline" size={20} color="#0D0D0F" />
                </Pressable>
            </View>
        </View>
    )
}