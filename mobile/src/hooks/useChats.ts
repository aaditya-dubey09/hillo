import { useApi } from "@/src/lib/axios";
import type { Chat } from "@/src/types";
import { useAuth } from "@clerk/expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

export const useGetOrCreateChat = () => {
    const { apiWithAuth } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (participantId: string) => {
            const { data } = await apiWithAuth<Chat>({
                method: "POST",
                url: `/chats/with/${participantId}`,
            });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chats"] });
        },
    });
};