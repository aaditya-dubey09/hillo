import { useAuthCallback } from "@/src/hooks/useAuth";
import { useAuth, useUser } from "@clerk/expo";
import * as Sentry from "@sentry/react-native";
import { isAxiosError } from "axios";
import { useEffect, useRef } from "react";
import { useSocketStore } from "../lib/socket";

const AuthSync = () => {
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const { mutate: syncUser, status, reset } = useAuthCallback();
    const wasSignedIn = useRef(false); // ref to know if we need to clear state on sign-out

    const {} = useSocketStore();

    useEffect(() => {
        if (isSignedIn && user && status === "idle") {
            wasSignedIn.current = true;
            syncUser(undefined, {
                onSuccess: (data) => {
                    console.log("User synced successfully");
                    Sentry.captureMessage("User synced with backend", {
                        level: "info",
                        tags: { userId: user.id },
                    });
                },
                onError: (error) => {
                    console.error("Error syncing user:", error);
                    
                    let errorMessage = "User sync failed";
                    let statusCode = "unknown";

                    if (isAxiosError(error)) {
                        errorMessage= error.response?.data?.message || error.message || "User sync failed";
                        statusCode = error.response?.status?.toString() ?? "unknown";
                    } else if (error instanceof Error) {
                        errorMessage = error.message;
                    }
                    Sentry.captureException(new Error(errorMessage), {
                        level: "error",
                        tags: { 
                            userId: user.id ?? "unknown",
                            status: statusCode,
                        },
                    });
                },
            });
        }

        // Sign out reset
        if (!isSignedIn && wasSignedIn.current) {
            reset();
            wasSignedIn.current = false;
        }
    }, [isSignedIn, user, syncUser, status, reset]);

    return null;
}

export default AuthSync;