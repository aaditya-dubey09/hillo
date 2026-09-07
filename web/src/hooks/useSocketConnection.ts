import { useAuth } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSocketStore } from '../lib/socket';

export const useSocketConnection = (activeChatId: string | null) => {
    const { getToken, isSignedIn, userId } = useAuth();
    const queryClient = useQueryClient();
    const { socket, connect, disconnect, joinChat, leaveChat } = useSocketStore();

    // connect socket on mount
    useEffect(() => {
        let disposed = false;
        if (isSignedIn && userId) {
            getToken().then((token) => {
                if (!disposed && token) connect(token, queryClient, userId);
            });
        } else {
            disposed = true;
            disconnect();
        }

        return () => {
            disposed = true;
            disconnect();
        };
    }, [isSignedIn, userId, connect, disconnect, getToken, queryClient]);

    // join/leave chat rooms
    useEffect(() => {
        if (activeChatId && socket) {
            joinChat(activeChatId);
            return () => leaveChat(activeChatId);
        }
    }, [activeChatId, socket, joinChat, leaveChat]);

    return null
}
