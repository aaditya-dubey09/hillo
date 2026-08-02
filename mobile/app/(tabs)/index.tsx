import { ScrollView, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';

const ChatTab = () => {
    return (
        <SafeAreaView className="flex-1 bg-surface px-4">
            <ScrollView>
                <Text className="text-white">Chat Tab</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ChatTab