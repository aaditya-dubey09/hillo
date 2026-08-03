import { useApi } from "@/lib/axios";
import type { Chat } from "@/types";
import { useAuth } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";

export const useChats = () => {
    const { userId } = useAuth();
    const { apiWithAuth } = useApi();

    return useQuery({
        queryKey: ["chats", userId],
        queryFn: async () => {
            const { data } = await apiWithAuth<Chat[]>({
                method: "GET",
                url: "/chats",
            })
            return data;
        },
        enabled: !!userId, // Only fetch when userId is present
    });
};