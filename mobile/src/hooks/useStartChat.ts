import { useGetOrCreateChat } from '@/src/hooks/useChats';
import type { Chat, User } from '@/src/types';
import { useRouter } from 'expo-router';

export const useStartChat = () => {
    const router = useRouter();
    const {
        mutate: getOrCreateChat,
        isPending: isCreatingChat,
        isError: isChatError,
        error: chatError,
    } = useGetOrCreateChat();

    const openChat = (
        { chat, user }: { chat?: Chat; user?: User },
        onBeforeNavigate?: () => void
    ) => {
        // Active Chat: Already has a valid _id, navigate directly
        if (chat) {
            onBeforeNavigate?.();
            router.push({
                pathname: '/chat/[id]',
                params: {
                    id: chat._id,
                    participantId: chat.participant?._id || '',
                    name: chat.participant?.name || '',
                    avatar: chat.participant?.avatar || '',
                },
            });
            return;
        }

        // Direct User Click: Resolve or create chat first, then navigate
        if (user && !isCreatingChat) {
            getOrCreateChat(user._id, {
                onSuccess: (createdChat) => {
                    const participant = createdChat.participant ?? user;

                    onBeforeNavigate?.();

                    requestAnimationFrame(() => {
                        router.push({
                            pathname: '/chat/[id]',
                            params: {
                                id: createdChat._id,
                                participantId: participant._id,
                                name: participant.name,
                                avatar: participant.avatar,
                            },
                        });
                    });
                },
                onError: (err) => {
                    console.error('Error starting chat:', err);
                },
            });
        }
    };

    return {
        openChat,
        isCreatingChat,
        isChatError,
        chatError,
    };
};