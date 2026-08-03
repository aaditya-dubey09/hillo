import { Pressable, ScrollView, Text } from 'react-native'
import React from 'react'
import { useAuth } from '@clerk/expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

const ProfileTab = () => {
    const { signOut } = useAuth()
    const queryClient = useQueryClient();

    const handleSignOut = async () => {
        await signOut();
        queryClient.clear(); // Flushes all user data from memory cache
    };

    return (
        <SafeAreaView className="flex-1 bg-surface px-4">
        <ScrollView>
            <Text className="text-white">Profile Tab</Text>
            <Pressable
                onPress={handleSignOut}
                className="mt-4 bg-red-600 px-4 py-2 rounded-lg"
            >
                <Text className="text-white">Sign Out</Text>
                </Pressable>
        </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileTab