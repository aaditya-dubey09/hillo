import { useAuthCallback } from "@/hooks/useAuth";
import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/expo";
import * as Sentry from "@sentry/react-native";

const AuthSync = () => {
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const { mutate: syncUser } = useAuthCallback();
    const hasSynced = useRef(false); // this is used to not run useEffect more than once

    useEffect(() => {
        if (isSignedIn && user && !hasSynced.current) {
            hasSynced.current = true; // set to true to prevent future calls
            syncUser(undefined, {
                onSuccess: (data) => {
                    console.log("User synced successfully");
                    Sentry.logger.info(Sentry.logger.fmt`User synced with backend: ${data.name}`, {
                        userId: user.id,
                        username: data.name,
                    });
                },
                onError: (error) => {
                    console.error("Error syncing user:", error);
                    Sentry.logger.error("Failed to sync user with backend", {
                        userId: user.id,
                        error: error instanceof Error ? error.message : String(error),
                    });
                },
            });
        }

        if (!isSignedIn) {
            hasSynced.current = false; // reset to allow future syncs when user signs in again
        }
    }, [isSignedIn, user, syncUser])

    return null;
}

export default AuthSync