import { useAuth } from '@clerk/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { Chat } from '../types';

export const useChats = () => {
    const { userId, getToken } = useAuth();

    return useQuery({
        queryKey: ["chats", userId],
        queryFn: async () => {
            const token = await getToken();
            const res = await api.get<Chat[]>("/chats", {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data;
        },
        enabled: !!userId, // Only fetch when userId is present
    })
}

export const useGetOrCreateChat = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (participantId: string) => {
            const token = await getToken();
            const res = await api.post<Chat>(
                `/chats/with/${participantId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            )
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chats"] }),
    })
}