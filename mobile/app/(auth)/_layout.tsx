import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';

const AuthLayout = () => {
    const { isSignedIn } = useAuth();
    if (isSignedIn) return <Redirect href="/(tabs)" />;

    return <Stack screenOptions={{ headerShown: false }} />;
};

export default AuthLayout