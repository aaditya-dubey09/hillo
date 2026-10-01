import { useAuth } from '@clerk/expo';
import { useSocketStore } from '../lib/socket';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

const SocketConnection = () => {
    const { getToken, isSignedIn, userId } = useAuth();
    const queryClient = useQueryClient();
    const connect = useSocketStore((state) => state.connect);
    const disconnect = useSocketStore((state) => state.disconnect);

    // Store the getToken function in a ref to avoid stale closures
    // todo: check if this is needed now or not
    const getTokenRef = useRef(getToken);
    useEffect(() => {
        getTokenRef.current = getToken;
    }, [getToken]);

    useEffect(() => {
        let isMounted = true;
        if (isSignedIn && userId) {
            getTokenRef.current().then((token) => {
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
    }, [isSignedIn, connect, disconnect, queryClient, userId, getToken]);

    return null;
};

export default SocketConnection;