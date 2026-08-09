import { useQuery } from '@tanstack/react-query';
import type { User } from '@/src/types';
import { useApi } from '@/src/lib/axios';

export const useUsers = () => {
    const { apiWithAuth } = useApi();

    return useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const { data } = await apiWithAuth<User[]>({ method: "GET", url: "/users" });
            return data;
        },
    });
};
