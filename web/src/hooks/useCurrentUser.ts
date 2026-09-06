import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import { useAuth } from "@clerk/react";
import type { User } from "../types";

export const useCurrentUser = () => {
    const { getToken, isSignedIn } = useAuth();

    return useQuery({
        queryKey: ["currentUser"],
        queryFn: async () => {
            const token = await getToken();
            const { data } = await api.get<User | undefined>("/auth/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            return data;
        },
        enabled: !!isSignedIn, // Only run the query if the user is signed in
    });
};