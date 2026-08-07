import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EditProfileModal } from '@/src/components/profile/EditProfileModal';
import { MenuItemRow } from '@/src/components/profile/MenuItemRow';
import { ProfileHeader } from '@/src/components/profile/ProfileHeader';
import { useProfileViewModel } from '@/src/hooks/useProfileViewModel';
import type { MenuSection } from '@/src/types/profile';
import EmptyUI from '@/src/components/common/EmptyUI';

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
    const {
        isLoaded,
        user,
        isSigningOut,
        isUpdatingAvatar,
        isSavingProfile,
        isEditModalOpen,
        modalStep,
        firstName,
        lastName,
        email,
        verificationCode,
        setFirstName,
        setLastName,
        setEmail,
        setVerificationCode,
        handleEditAvatar,
        handleSaveProfile,
        handleCloseModal,
        handleVerifyEmailCode,
        handleMenuItemPress,
        handleSignOut,
    } = useProfileViewModel();

    if (!isLoaded) {
        return <ActivityIndicator size="large" color="#F4A261"/>;
    };

    if (!user) {
        return (
            <SafeAreaView className="flex-1 bg-surface-dark px-4 justify-center items-center">
                <EmptyUI
                    title="User not found"
                    subtitle="Please try logging in again or refresh."
                    iconName="person-outline"
                    iconColor="#6B6B70"
                    iconSize={64}
                    buttonLabel="Retry / Go to Login"
                    // todo: pass a refresh function or trigger sign-out to clear the broken session
                    onPressButton={handleSignOut}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-surface-dark px-4">
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <ProfileHeader
                    imageUrl={user?.imageUrl}
                    firstName={user?.firstName}
                    lastName={user?.lastName}
                    email={user?.primaryEmailAddress?.emailAddress}
                    isUpdatingAvatar={isUpdatingAvatar}
                    onEditAvatar={handleEditAvatar}
                />

                {MENU_SECTIONS.map((section) => (
                    <View key={section.title} className="mt-6 mx-4">
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

                <Pressable
                    className="mx-5 mt-8 bg-red-500/10 rounded-2xl py-4 items-center active:opacity-70 border border-red-500/20"
                    onPress={handleSignOut}
                    disabled={isSigningOut}
                >
                    <View className="flex-row items-center">
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                        <Text className="ml-2 text-red-500 font-semibold">
                            {isSigningOut ? "Logging out..." : "Log Out"}
                        </Text>
                    </View>
                </Pressable>
            </ScrollView>

            <EditProfileModal
                visible={isEditModalOpen}
                firstName={firstName}
                lastName={lastName}
                email={email}
                step={modalStep}
                verificationCode={verificationCode}
                isSaving={isSavingProfile}
                onChangeFirstName={setFirstName}
                onChangeLastName={setLastName}
                onChangeEmail={setEmail}
                onChangeVerificationCode={setVerificationCode}
                onClose={handleCloseModal}
                onSave={handleSaveProfile}
                onVerifyCode={handleVerifyEmailCode}
            />
        </SafeAreaView>
    );
};

export default ProfileTab;