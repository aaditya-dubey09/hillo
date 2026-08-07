import type { EditProfileModalProps } from '@/src/types/profile';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';

export const EditProfileModal = ({
    visible,
    firstName,
    lastName,
    email,
    step,
    verificationCode,
    isSaving,
    onChangeFirstName,
    onChangeLastName,
    onChangeEmail,
    onChangeVerificationCode,
    onClose,
    onSave,
    onVerifyCode,
}: EditProfileModalProps) => {
    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View className="flex-1 bg-black/70 justify-end">
                <View className="bg-surface-card rounded-t-3xl p-6 border-t border-surface-light">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-foreground">
                            {step === 'edit' ? "Edit Profile" : "Verify New Email"}
                        </Text>
                        <Pressable onPress={onClose} disabled={isSaving}>
                            <Ionicons name="close" size={24} color="#A1A1AA" />
                        </Pressable>
                    </View>

                    {step === 'edit' ? (
                        <>
                            <Text className="text-xs text-subtle-foreground mb-1 font-medium">FIRST NAME</Text>
                            <TextInput
                                className="bg-surface-dark text-foreground p-4 rounded-xl mb-4 border border-surface-light"
                                value={firstName}
                                onChangeText={onChangeFirstName}
                                placeholder="First Name"
                                placeholderTextColor="#6B6B70"
                            />

                            <Text className="text-xs text-subtle-foreground mb-1 font-medium">LAST NAME</Text>
                            <TextInput
                                className="bg-surface-dark text-foreground p-4 rounded-xl mb-4 border border-surface-light"
                                value={lastName}
                                onChangeText={onChangeLastName}
                                placeholder="Last Name"
                                placeholderTextColor="#6B6B70"
                            />

                            <Text className="text-xs text-subtle-foreground mb-1 font-medium">EMAIL ADDRESS</Text>
                            <TextInput
                                className="bg-surface-dark text-foreground p-4 rounded-xl mb-6 border border-surface-light"
                                value={email}
                                onChangeText={onChangeEmail}
                                placeholder="Email Address"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholderTextColor="#6B6B70"
                            />

                            <Pressable
                                className="bg-primary py-4 rounded-xl items-center active:opacity-80"
                                onPress={onSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#0D0D0F" />
                                ) : (
                                    <Text className="text-surface-dark font-bold text-base">Save Changes</Text>
                                )}
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <Text className="text-subtle-foreground mb-4 text-sm">
                                We sent a 6-digit verification code to <Text className="text-foreground font-bold">{email}</Text>.
                            </Text>

                            <Text className="text-xs text-subtle-foreground mb-1 font-medium">VERIFICATION CODE</Text>
                            <TextInput
                                className="bg-surface-dark text-foreground p-4 rounded-xl mb-6 border border-surface-light text-center text-xl tracking-widest font-mono"
                                value={verificationCode}
                                onChangeText={onChangeVerificationCode}
                                placeholder="123456"
                                keyboardType="number-pad"
                                maxLength={6}
                                placeholderTextColor="#6B6B70"
                            />

                            <Pressable
                                className="bg-primary py-4 rounded-xl items-center active:opacity-80"
                                onPress={onVerifyCode}
                                disabled={isSaving || verificationCode.length < 6}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#0D0D0F" />
                                ) : (
                                    <Text className="text-surface-dark font-bold text-base">Verify & Update Email</Text>
                                )}
                            </Pressable>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};