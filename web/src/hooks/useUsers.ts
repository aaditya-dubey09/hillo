import { useAuth } from '@clerk/react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import type { User } from '../types';

export const useUsers = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const token = await getToken();
            const res = await api.get<User[]>("/users", {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.data;
        }
    })
}