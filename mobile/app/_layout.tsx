import { Stack } from "expo-router";
// @ts-ignore - side-effect CSS import for Expo web/native styling
import AuthSync from "@/src/components/AuthSync";
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from 'expo-status-bar';
import "../global.css";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://3ac12c41ecbe2e4452b1331350c0c39c@o4511842183872512.ingest.us.sentry.io/4511842195406848',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,
  tracesSampleRate: __DEV__ ? 0.0 : 0.01,

  // Completely disables error reporting in local development
  enabled: !__DEV__,

  // Configure Session Replay
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: __DEV__ ? 0.0 : 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.reactNativeTracingIntegration({
      traceFetch: true,
      traceXHR: true,
      enableHTTPTimings: true,
    }),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

const queryClient = new QueryClient();

export default Sentry.wrap(function RootLayout() {
  return (
    <>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <QueryClientProvider client={queryClient}>
          <AuthSync />
          <StatusBar style="light" />
          <Stack screenOptions={{
            headerShown: false, contentStyle: {
              backgroundColor: "#0D0D0F"
            }
          }}>
            <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
            <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
          </Stack>
        </QueryClientProvider>
      </ClerkProvider>
    </>
  );
});
