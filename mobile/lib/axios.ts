import axios from "axios";
import * as Sentry from "@sentry/react-native";
import { useAuth } from "@clerk/expo";
import { useCallback } from "react";

const API_URL = "https://hillo-t16j.onrender.com/api"

const api = axios.create({
    baseURL: API_URL,
    headers: { "Content-Type": "application/json" },
});


api.interceptors.response.use((response) => response, (error) => {
    // log api errors to sentry
    if (error.response) {
        Sentry.captureException(error, {
            level: "error",
            tags: {
                status: error.response.status,
                endpoint: error.config?.url,
                method: error.config?.method?.toUpperCase(),
            }
        });
    } else if (error.request) {
        Sentry.captureMessage(`API request failed — no response: ${error.config?.url}`, {
            level: "warning",
            tags: {
                endpoint: error.config?.url,
                method: error.config?.method?.toUpperCase(),
            }
        });
    }

    return Promise.reject(error);
})

export const useApi = () => {
    const { getToken } = useAuth();

    const apiWithAuth = useCallback(async<T>(config: Parameters<typeof api.request>[0]) => {
        const token = await getToken();

        return api.request<T>({
            ...config,
            headers: {
                ...config.headers, ...(token && { Authorization: `Bearer ${token}` })
            },
        });
    },
        [getToken]
    );

    return { api, apiWithAuth };
};
