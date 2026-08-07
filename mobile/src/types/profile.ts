export interface MenuItem {
    icon: string;
    label: string;
    color: string;
    value?: string;
    actionKey?: string;
    disabled?: boolean;
    isExternal?: boolean;
}

export interface MenuItemRowProps {
    item: MenuItem;
    isLast: boolean;
    onPress: (actionKey?: string) => void;
}

export interface MenuSection {
    title: string;
    items: MenuItem[];
}

export type ModalStep = 'edit' | 'verify_email';

export interface ProfileHeaderProps {
    imageUrl?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string;
    isUpdatingAvatar: boolean;
    onEditAvatar: () => void;
}

export interface EditProfileModalProps {
    visible: boolean;
    firstName: string;
    lastName: string;
    email: string;
    step: ModalStep;
    verificationCode: string;
    isSaving: boolean;
    onChangeFirstName: (text: string) => void;
    onChangeLastName: (text: string) => void;
    onChangeEmail: (text: string) => void;
    onChangeVerificationCode: (text: string) => void;
    onClose: () => void;
    onSave: () => void;
    onVerifyCode: () => void;
}