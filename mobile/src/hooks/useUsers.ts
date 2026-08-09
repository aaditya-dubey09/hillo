import { useApi } from '@/src/lib/axios';
import type { User } from '@/src/types';
import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';

export const useUsers = () => {
    const { apiWithAuth } = useApi();
    const { userId } = useAuth();

    return useQuery({
        queryKey: ["users", userId],
        queryFn: async () => {
            const { data } = await apiWithAuth<User[]>({ method: "GET", url: "/users" });
            return data;
        },
        enabled: !!userId, // Only fetch when userId is present
    });
};
