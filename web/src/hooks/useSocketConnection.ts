import { useAuth } from '@clerk/react';
import { useSocketStore } from '../lib/socket';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useCurrentUser } from './useCurrentUser';

export const useSocketConnection = (activeChatId: string | null) => {
    const { getToken, isSignedIn } = useAuth();
    const queryClient = useQueryClient();
    const { data: currentUser } = useCurrentUser();
    const { socket, connect, disconnect, joinChat, leaveChat } = useSocketStore();

    // connect socket on mount
    const currentUserId = currentUser?._id;
    useEffect(() => {
        let disposed = false;
        if (isSignedIn && currentUserId) {
            getToken().then((token) => {
                if (!disposed && token) connect(token, queryClient, currentUserId);
            });
        } else {
            disposed = true;
            disconnect();
        }

        return () => {
            disposed = true;
            disconnect();
        };
    }, [isSignedIn, currentUserId, connect, disconnect, getToken, queryClient]);

    // join/leave chat rooms
    useEffect(() => {
        if (activeChatId && socket) {
            joinChat(activeChatId);
            return () => leaveChat(activeChatId);
        }
    }, [activeChatId, socket, joinChat, leaveChat]);

    return null
}
