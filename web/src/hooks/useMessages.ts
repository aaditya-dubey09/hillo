import { useAuth } from '@clerk/react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import type { Message } from '../types';

export const useMessages = (chatId?: string) => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ["messages", chatId],
        queryFn: async (): Promise<Message[]> => {
            const token = await getToken();
            const res = await api.get<Message[]>(`/messages/chat/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data;
        },
        enabled: !!chatId, // Only run the query if chatId is defined
    })
}