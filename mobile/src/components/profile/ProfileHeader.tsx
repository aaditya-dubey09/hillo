import type { ProfileHeaderProps } from '@/src/types/profile';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';

export const ProfileHeader = ({
    imageUrl,
    firstName,
    lastName,
    email,
    isUpdatingAvatar,
    onEditAvatar,
}: ProfileHeaderProps) => {
    const [isImageFullscreen, setIsImageFullscreen] = useState(false);

    return (
        <View className="relative">
            <View className="items-center mt-10">
                <View className="relative">
                    <View className="rounded-full border-2 border-primary overflow-hidden">
                        <Pressable
                            className="rounded-full border-2 border-primary overflow-hidden active:opacity-90"
                            accessibilityRole="button"
                            accessibilityLabel="View profile photo in fullscreen"
                            onPress={() => setIsImageFullscreen(true)}
                        >
                            <Image
                                source={imageUrl}
                                style={{ width: 100, height: 100, borderRadius: 999 }}
                                transition={200}
                            />
                            {isUpdatingAvatar && (
                                <View className="absolute inset-0 bg-black/50 items-center justify-center">
                                    <ActivityIndicator color="#FFFFFF" />
                                </View>
                            )}
                        </Pressable>
                    </View>

                    <Pressable
                        className="absolute bottom-1 right-1 w-8 h-8 bg-primary rounded-full items-center justify-center border-2 border-surface-dark active:opacity-80"
                        accessibilityRole="button"
                        accessibilityLabel="Edit profile photo"
                        onPress={onEditAvatar}
                        disabled={isUpdatingAvatar}
                    >
                        <Ionicons name="camera" size={16} color="#0D0D0F" />
                    </Pressable>
                </View>

                <Text className="text-2xl font-bold text-foreground mt-4">
                    {firstName} {lastName}
                </Text>
                <Text className="text-muted-foreground mt-1">
                    {email ?? "No email available"}
                </Text>

                <View className="flex-row items-center mt-3 bg-green-500/20 px-3 py-1.5 rounded-full">
                    <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                    <Text className="text-green-500 text-sm font-bold">Online</Text>
                </View>
            </View>

            {/* Fullscreen image modal */}
            <Modal visible={isImageFullscreen} transparent animationType="fade" onRequestClose={() => setIsImageFullscreen(false)}>
                <Pressable className="flex-1 bg-black/95 items-center justify-center" onPress={() => setIsImageFullscreen(false)}>
                    <View className="absolute top-12 right-6 z-10">
                        <Ionicons name="close-outline" size={32} color="#FFFFFF" />
                    </View>

                    <Image
                        source={imageUrl}
                        style={{ width: '90%', aspectRatio: 1, borderRadius: 30}}
                        contentFit="contain"
                    />
                </Pressable>
            </Modal>
        </View >
    );
};