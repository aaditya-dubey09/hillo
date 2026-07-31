import { Stack } from "expo-router";
// @ts-ignore - side-effect CSS import for Expo web/native styling
import "../global.css";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider } from '@clerk/expo'
import { tokenCache } from '@clerk/expo/token-cache'
import { Slot } from 'expo-router'

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </QueryClientProvider>
      </ClerkProvider>
    </>
  );
}
