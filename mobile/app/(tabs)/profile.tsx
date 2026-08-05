import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { MenuItem, MenuItemRow } from '@/components/profile/MenuItemRow';
import { useAuth, useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from "expo-image";
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Pressable,
    ScrollView,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MenuSection {
    title: string;
    items: MenuItem[];
}

const MENU_SECTIONS: MenuSection[] = [
    {
        title: "Account",
        items: [
            { icon: "person-outline", label: "Edit Profile", color: "#F4A261", actionKey: "edit_profile" },
            { icon: "shield-checkmark-outline", label: "Privacy & Security", color: "#10B981", actionKey: "privacy_security", isExternal: true },
            { icon: "notifications-outline", label: "Notifications", value: "On", color: "#8B5CF6", disabled: true },
        ],
    },
    {
        title: "Preferences",
        items: [
            { icon: "moon-outline", label: "Dark Mode", value: "On", color: "#6366F1", disabled: true },
            { icon: "language-outline", label: "Language", value: "English", color: "#EC4899", disabled: true },
            { icon: "cloud-outline", label: "Data & Storage", value: "1.2 GB", color: "#14B8A6", disabled: true },
        ],
    },
    {
        title: "Support",
        items: [
            { icon: "help-circle-outline", label: "Help Center", color: "#F59E0B", actionKey: "help_center", isExternal: true },
            { icon: "chatbubble-outline", label: "Contact Us", color: "#3B82F6", actionKey: "contact_us", isExternal: true },
            { icon: "star-outline", label: "Rate the App", color: "#F4A261", actionKey: "rate_app", isExternal: true },
        ],
    },
];

const ProfileTab = () => {
    const { user } = useUser();
    const { signOut } = useAuth();
    const queryClient = useQueryClient();

    // UI States
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Edit Avatar Handler
    const handleEditAvatar = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert("Permission Required", "Permission to access media library is required to update avatar.");
                return;
            }

            const pickerResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
                base64: true,
            });

            if (pickerResult.canceled || !pickerResult.assets[0]?.base64) {
                return;
            }

            setIsUpdatingAvatar(true);
            const asset = pickerResult.assets[0];
            const base64Image = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;

            // Upload directly to Clerk
            await user?.setProfileImage({ file: base64Image });
            Alert.alert("Success", "Profile avatar updated successfully!");
        } catch (error) {
            Sentry.captureException(error);
            Alert.alert("Update Failed", "Could not update profile photo. Please try again.");
        } finally {
            setIsUpdatingAvatar(false);
        }
    };

    // Open Edit Modal with latest User state
    const handleOpenEditModal = () => {
        setFirstName(user?.firstName ?? '');
        setLastName(user?.lastName ?? '');
        setIsEditModalOpen(true);
    };

    // Name Update Modal Handler
    const handleSaveProfile = async () => {
        if (!firstName.trim()) {
            Alert.alert("Validation Error", "First name cannot be empty.");
            return;
        }

        setIsSavingProfile(true);
        try {
            await user?.update({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            });
            setIsEditModalOpen(false);
            Alert.alert("Success", "Profile updated successfully!");
        } catch (error) {
            Sentry.captureException(error);
            Alert.alert("Update Failed", "Failed to update profile information.");
        } finally {
            setIsSavingProfile(false);
        }
    };

    // External Actions
    const handleOpenLink = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert("Error", `Cannot open link: ${url}`);
            }
        } catch (error) {
            Sentry.captureException(error);
        }
    };

    const handleMenuItemPress = (actionKey?: string) => {
        switch (actionKey) {
            case "edit_profile":
                handleOpenEditModal();
                break;
            case "privacy_security":
                handleOpenLink("https://hillo-t16j.onrender.com/privacy");
                break;
            case "help_center":
                handleOpenLink("https://hillo-t16j.onrender.com/help");
                break;
            case "contact_us":
                handleOpenLink("mailto:aadityadubey219@gmail.com");
                break;
            case "rate_app":
                handleOpenLink("https://play.google.com/store/apps/details?id=com.hillo.app");
                break;
            default:
                break;
        }
    };

    // Sign Out Confirmation & Handler
    const handleSignOut = async () => {
        if (isSigningOut) return;
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Sign Out",
                    onPress: handleConfirmSignOut,
                    style: "destructive",
                },
            ],
            { cancelable: true }
        );
    };

    const handleConfirmSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut();
            queryClient.clear(); // Flushes all user data from memory cache
        } catch (error) {
            Sentry.captureException(error);
            Alert.alert("Sign Out Failed", "Unable to sign out. Please try again.");
        } finally {
            setIsSigningOut(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-surface-dark px-4">
            <ScrollView
                contentContainerStyle={{ paddingBottom: 30 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="relative">
                    <View className="items-center mt-10">
                        <View className="relative">
                            <View className="rounded-full border-2 border-primary overflow-hidden">
                                <Image
                                    source={user?.imageUrl}
                                    style={{ width: 100, height: 100, borderRadius: 999 }}
                                />
                                {isUpdatingAvatar && (
                                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                                        <ActivityIndicator color="#FFFFFF" />
                                    </View>
                                )}
                            </View>

                            <Pressable 
                                className="absolute bottom-1 right-1 w-8 h-8 bg-primary rounded-full items-center justify-center border-2 border-surface-dark active:opacity-80" 
                                onPress={handleEditAvatar}
                                disabled={isUpdatingAvatar}
                            >
                                <Ionicons name="camera" size={16} color="#0D0D0F" />
                            </Pressable>
                        </View>

                        {/* Name & email */}
                        <Text className="text-2xl font-bold text-foreground mt-4">
                            {user?.firstName} {user?.lastName}
                        </Text>
                        <Text className="text-muted-foreground mt-1">
                            {user?.primaryEmailAddress?.emailAddress ?? "No email available"}
                        </Text>

                        <View className="flex-row items-center mt-3 bg-green-500/20 px-3 py-1.5 rounded-full">
                            <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                            <Text className="text-green-500 text-sm font-bold">Online</Text>
                        </View>
                    </View>
                </View>

                {/* Menu */}
                {MENU_SECTIONS.map((section) => (
                    <View key={section.title} className="mt-6">
                        <Text className="text-subtle-foreground text-xs font-semibold uppercase tracking-wider mb-2 ml-1">
                            {section.title}
                        </Text>
                        <View className="bg-surface-card rounded-2xl overflow-hidden">
                            {section.items.map((item, index) => (
                                <MenuItemRow
                                    key={item.label}
                                    item={item}
                                    isLast={index === section.items.length - 1}
                                    onPress={handleMenuItemPress}
                                />
                            ))}
                        </View>
                    </View>
                ))}

                {/* Sign-out btn */}
                <Pressable
                    className="mt-8 bg-red-500/10 rounded-2xl py-4 items-center active:opacity-70 border border-red-500/20"
                    onPress={() => handleSignOut()}
                    disabled={isSigningOut}
                >
                    <View className="flex-row items-center">
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                        <Text className="ml-2 text-red-500 font-semibold">{isSigningOut ? "Logging out..." : "Log Out"}</Text>
                    </View>
                </Pressable>
            </ScrollView>

            <EditProfileModal
                visible={isEditModalOpen}
                firstName={firstName}
                lastName={lastName}
                isSaving={isSavingProfile}
                onChangeFirstName={setFirstName}
                onChangeLastName={setLastName}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveProfile}
            />
        </SafeAreaView>
    );
};

export default ProfileTab;