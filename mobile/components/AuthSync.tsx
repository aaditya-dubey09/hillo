import { useAuthCallback } from "@/hooks/useAuth";
import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/expo";
import * as Sentry from "@sentry/react-native";

const AuthSync = () => {
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const { mutate: syncUser, status } = useAuthCallback();
    const wasSignedIn = useRef(false); // ref to know if we need to clear state on sign-out

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
                    Sentry.captureException("Failed to sync user with backend", {
                        level: "error",
                        tags: { userId: user.id },
                    });
                },
            });
        }

        // Sign out reset
        if (!isSignedIn && wasSignedIn.current) {
            wasSignedIn.current = false;
        }
    }, [isSignedIn, user, syncUser, status]);

    return null;
}

export default AuthSync;