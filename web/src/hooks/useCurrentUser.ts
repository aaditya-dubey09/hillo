import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import { useAuth } from "@clerk/react";
import type { User } from "../types";

export const useCurrentUser = () => {
    const { getToken, isSignedIn, userId } = useAuth();

    return useQuery({
        queryKey: ["currentUser", userId],
        queryFn: async () => {
            const token = await getToken();
            const { data } = await api.get<User | undefined>("/auth/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            return data;
        },
        enabled: !!isSignedIn, // Note: Only run the query if the user is signed in. But we're only calling this hook in the ChatPage component, which is only accessible to signed-in users — so this is just a safety measure.
    });
};