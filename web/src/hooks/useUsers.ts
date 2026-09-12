import { useAuth } from '@clerk/react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import type { User } from '../types';

export const useUsers = () => {
    const { getToken, userId } = useAuth();

    return useQuery({
        queryKey: ["users", userId],
        queryFn: async () => {
            const token = await getToken();
            const res = await api.get<User[]>("/users", {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data;
        },
        enabled: !!userId, // Only fetch when userId is present
    })
}