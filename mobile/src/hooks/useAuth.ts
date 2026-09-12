import { useApi } from "@/src/lib/axios";
import { User } from "@/src/types";
import { useAuth } from "@clerk/expo";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useAuthCallback = () => {
    const { apiWithAuth } = useApi();

    return useMutation({
        mutationFn: async () => {
            const { data } = await apiWithAuth<User>({ method: "POST", url: "/auth/callback" });
            return data;
        }
    });
};

export const useCurrentUser = () => {
    const { apiWithAuth } = useApi();
    const { isSignedIn, userId } = useAuth();

    return useQuery({
        queryKey: ["currentUser", userId],
        queryFn: async () => {
            const { data } = await apiWithAuth<User>({ method: "GET", url: "/auth/me" });
            return data;
        },
        enabled: !!isSignedIn, // Note: Only run the query if the user is signed in. But we're only calling this hook in the Chat screen, which is only accessible to signed-in users — so this is just a safety measure.
    });
};
