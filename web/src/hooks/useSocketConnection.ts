import { useAuth } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useSocketStore } from '../lib/socket';

export const useSocketConnection = (activeChatId: string | null) => {
    const { getToken, isSignedIn, userId } = useAuth();
    const queryClient = useQueryClient();
    const { socket, connect, disconnect, joinChat, leaveChat } = useSocketStore();

    // connect socket on mount and handle disconnect/reconnect on user switch
    useEffect(() => {
        let isMounted = true;

        if (isSignedIn && userId) {
            getToken().then((token) => {
                if (isMounted && token) {
                    connect(getToken, queryClient, userId);
                }
            });
        } else {
            disconnect();
        }

        return () => {
            isMounted = false;
            disconnect();
        };
    }, [isSignedIn, userId, connect, disconnect, queryClient, getToken]);

    // join/leave chat rooms
    useEffect(() => {
        if (activeChatId && socket) {
            joinChat(activeChatId);
            return () => leaveChat(activeChatId);
        }
    }, [activeChatId, socket, joinChat, leaveChat]);

    return null;
};
