import { useApi } from "@/src/lib/axios";
import { User } from "@/src/types";
import { useMutation } from "@tanstack/react-query";

export const useAuthCallback = () => {
    const { apiWithAuth } = useApi();

    return useMutation({
        mutationFn: async () => {
            const { data } = await apiWithAuth<User>({ method: "POST", url: "/auth/callback" });
            return data;
        }
    });
};
