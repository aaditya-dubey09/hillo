import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';

interface EditProfileModalProps {
    visible: boolean;
    firstName: string;
    lastName: string;
    isSaving: boolean;
    onChangeFirstName: (text: string) => void;
    onChangeLastName: (text: string) => void;
    onClose: () => void;
    onSave: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
    visible,
    firstName,
    lastName,
    isSaving,
    onChangeFirstName,
    onChangeLastName,
    onClose,
    onSave,
}) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/70 justify-end">
                <View className="bg-surface-card rounded-t-3xl p-6 border-t border-surface-light">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-foreground">Edit Profile</Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close" size={24} color="#A1A1AA" />
                        </Pressable>
                    </View>

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
                        className="bg-surface-dark text-foreground p-4 rounded-xl mb-6 border border-surface-light"
                        value={lastName}
                        onChangeText={onChangeLastName}
                        placeholder="Last Name"
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
                </View>
            </View>
        </Modal>
    );
};