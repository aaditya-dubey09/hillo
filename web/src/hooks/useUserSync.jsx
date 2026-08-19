import { useAuth } from "@clerk/react";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import api from "../lib/axios";

export const useUserSync = () => {
    const { isSignedIn, getToken, userId } = useAuth();
    const {
        mutate: syncUser,
        isPending,
        isSuccess,
        isError,
        reset
    } = useMutation({
        mutationFn: async () => {
            const token = await getToken();
            const res = await api.post(
                "/auth/callback",
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            return res.data;
        },
    });

    // Reset mutation state when the logged-in user changes or logs out
    useEffect(() => {
        reset();
    }, [userId, reset]);

    useEffect(() => {
        if (isSignedIn && userId && !isPending && !isSuccess && !isError) {
            syncUser();
        }
    }, [isSignedIn, userId, syncUser, isPending, isSuccess, isError]);

    return { isSynced: isSuccess, isSyncing: isPending };
}