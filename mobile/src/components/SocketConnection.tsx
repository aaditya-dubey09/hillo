import { useAuth } from '@clerk/expo';
import { useSocketStore } from '../lib/socket';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

const SocketConnection = () => {
    const { getToken, isSignedIn, userId } = useAuth();
    const queryClient = useQueryClient();
    const connect = useSocketStore((state) => state.connect);
    const disconnect = useSocketStore((state) => state.disconnect);

    useEffect(() => {
        let disposed = false;
        if (isSignedIn) {
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
    }, [isSignedIn, connect, disconnect, getToken, queryClient, userId]);

    return null
}

export default SocketConnection