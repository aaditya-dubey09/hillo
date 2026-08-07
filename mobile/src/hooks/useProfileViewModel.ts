import { useAuth, useUser } from '@clerk/expo';
import * as Sentry from '@sentry/react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import type { ModalStep } from '../types/profile';

export const useProfileViewModel = () => {
    const { user, isLoaded } = useUser();
    const { signOut } = useAuth();
    const queryClient = useQueryClient();

    // UI Loading States
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Form & Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState<ModalStep>('edit');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [pendingEmailObj, setPendingEmailObj] = useState<any>(null);

    const handleOpenEditModal = () => {
        setFirstName(user?.firstName ?? '');
        setLastName(user?.lastName ?? '');
        setEmail(user?.primaryEmailAddress?.emailAddress ?? '');
        setModalStep('edit');
        setVerificationCode('');
        setPendingEmailObj(null);
        setIsEditModalOpen(true);
    };

    const handleEditAvatar = async () => {
        if (!user) {
            Alert.alert("Error", "User session not found, please log in again.");
            return
        };
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

            if (pickerResult.canceled || !pickerResult.assets[0]?.base64) return;

            setIsUpdatingAvatar(true);
            const asset = pickerResult.assets[0];
            const base64Image = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;

            await user.setProfileImage({ file: base64Image });
            Alert.alert("Success", "Profile photo updated successfully!");
        } catch (error) {
            Sentry.captureException(error);
            Alert.alert("Update Failed", "Could not update profile photo.");
        } finally {
            setIsUpdatingAvatar(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) {
            Alert.alert("Error", "User session not found, please log in again.");
            return
        };
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        const trimmedEmail = email.trim().toLowerCase();

        const currentFirst = user?.firstName ?? '';
        const currentLast = user?.lastName ?? '';
        const currentEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? '';

        if (!trimmedFirst) {
            Alert.alert("Validation Error", "First name cannot be empty.");
            return;
        }

        const isFirstNameChanged = trimmedFirst !== currentFirst;
        const isLastNameChanged = trimmedLast !== currentLast;
        const isNameChanged = isFirstNameChanged || isLastNameChanged;
        const isEmailChanged = trimmedEmail !== '' && trimmedEmail !== currentEmail;

        // Strict Guard: Exit if nothing changed
        if (!isNameChanged && !isEmailChanged) {
            setIsEditModalOpen(false);
            return;
        }

        setIsSavingProfile(true);
        try {
            if (isNameChanged) {
                const namePayload: { firstName?: string; lastName?: string } = {};
                if (isFirstNameChanged) namePayload.firstName = trimmedFirst;
                if (isLastNameChanged) namePayload.lastName = trimmedLast;

                await user.update(namePayload);
            }

            if (isEmailChanged) {
                const emailRes = await user.createEmailAddress({ email: trimmedEmail });
                await emailRes.prepareVerification({ strategy: 'email_code' });

                setPendingEmailObj(emailRes);
                setModalStep('verify_email');
                setIsSavingProfile(false);
                return;
            }

            setIsEditModalOpen(false);
            Alert.alert("Success", "Profile updated successfully!");
        } catch (error: any) {
            Sentry.captureException(error);
            Alert.alert("Update Failed", error?.errors?.[0]?.message || "Failed to update profile.");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleCloseModal = async () => {
        if (pendingEmailObj && modalStep === 'verify_email') {
            try {
                // Deleting unverified email address from Clerk account
                await pendingEmailObj.destroy();
            } catch (err) {
                console.warn('Failed to cleanup unverified email:', err);
            }
        }

        setPendingEmailObj(null);
        setModalStep('edit');
        setVerificationCode('');
        setIsEditModalOpen(false);
    };

    const handleVerifyEmailCode = async () => {
        if (!user) {
            Alert.alert("Error", "User session not found, please log in again.");
            return
        };
        if (!pendingEmailObj || !verificationCode.trim()) return;

        setIsSavingProfile(true);
        try {
            const emailAttempt = await pendingEmailObj.attemptVerification({
                code: verificationCode.trim(),
            });

            if (emailAttempt.verification.status === 'verified') {
                await user.update({
                    primaryEmailAddressId: emailAttempt.id,
                });

                setIsEditModalOpen(false);
                Alert.alert("Success", "Email verified and updated successfully!");
            } else {
                Alert.alert("Verification Failed", "Invalid code. Please try again.");
            }
        } catch (error: any) {
            Sentry.captureException(error);
            Alert.alert("Verification Error", error?.errors?.[0]?.message || "Failed to verify email code.");
        } finally {
            setIsSavingProfile(false);
        }
    };

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
                handleOpenLink("mailto:support@hillo.com");
                break;
            case "rate_app":
                handleOpenLink("https://play.google.com/store/apps/details?id=com.hillo.app");
                break;
            default:
                break;
        }
    };

    const handleSignOut = async () => {
        if (isSigningOut) return;
        setIsSigningOut(true);
        try {
            await signOut();
            queryClient.clear();
        } catch (error) {
            Sentry.captureException(error);
            Alert.alert("Sign Out Failed", "Unable to sign out. Please try again.");
        } finally {
            setIsSigningOut(false);
        }
    };

    return {
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
        setIsEditModalOpen,
        handleEditAvatar,
        handleSaveProfile,
        handleCloseModal,
        handleVerifyEmailCode,
        handleMenuItemPress,
        handleSignOut,
    };
};