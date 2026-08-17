import { useApi } from "@/src/lib/axios";
import type { Message } from "@/src/types";
import { useQuery } from "@tanstack/react-query";

export const useMessages = (chatId: string) => {
    const { apiWithAuth } = useApi();

    return useQuery({
        queryKey: ["messages", chatId],
        queryFn: async (): Promise<Message[]> => {
            const { data } = await apiWithAuth<Message[]>({ 
                method: "GET", 
                url: `/messages/chat/${chatId}`, 
            });
            return data;
        },
        enabled: !!chatId, // Only run the query if chatId is provided
    });
};
