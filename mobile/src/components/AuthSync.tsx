import { useAuthCallback } from "@/src/hooks/useAuth";
import { useAuth, useUser } from "@clerk/expo";
import * as Sentry from "@sentry/react-native";
import { useEffect, useRef } from "react";

const AuthSync = () => {
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const { mutate: syncUser, status, reset } = useAuthCallback();
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
                    Sentry.captureException(error, {
                        level: "error",
                        tags: { userId: user.id ?? "unknown" },
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