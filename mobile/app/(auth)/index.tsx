import { View, Text, Dimensions, Pressable, ActivityIndicator } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import useAuthSocial from '@/hooks/useSocialAuth';

const { width, height } = Dimensions.get("window");

const AuthScreen = () => {
    const { handleSocialAuth, loadingStrategy } = useAuthSocial();
    const isLoading = loadingStrategy !== null;
    return (
        <View className="flex-1 bg-surface-dark">
            <View className="absolute inset-0 overflow-hidden"></View>
            <SafeAreaView className="flex-1">
                {/* Top Section - logo */}
                <View className="items-center pt-10">
                    <Image
                        source={require("../../assets/images/logo.png")}
                        style={{ width: 100, height: 100, marginVertical: -20 }}
                        contentFit="contain"
                        alt="Logo"
                    />
                    <Text className="text-4xl font-bold text-primary font-serif tracking-wider uppercase">hillo</Text>
                </View>

                {/* Center Section - hero img */}
                <View className="flex-1 justify-center items-center px-6">
                    <Image
                        source={require("../../assets/images/auth.png")}
                        style={{ width: width * 48, height: height * 0.3 }}
                        contentFit="contain"
                        alt="Auth"
                    />

                    {/* Headline */}
                    <View className="mt-6 items-center">
                        <Text className="text-5xl font-bold text-foreground text-center font-sans">Connect & Chat</Text>
                        <Text className="text-3xl font-bold text-primary font-mono">Seamlessly</Text>
                    </View>

                    {/* Auth Btns */}
                    <View className="flex-row gap-4 mt-10">
                        {/* Google Btns */}
                        <Pressable
                            className="flex-1 flex-row items-center justify-center gap-2 bg-white/95 py-4 rounded-2xl active:scale-[0.97]"
                            disabled={isLoading}
                            accessibilityRole="button"
                            accessibilityLabel="Continue with Google"
                            onPress={() => !isLoading && handleSocialAuth("oauth_google")}
                        >
                            {loadingStrategy === "oauth_google" ? (
                                <ActivityIndicator size="small" color="#1A1A1A" />
                            ) : (
                                <>
                                    <Image
                                        source={require("../../assets/images/google.png")}
                                        style={{ width: 20, height: 20 }}
                                        contentFit="contain"
                                        alt="Google"
                                    />
                                    <Text className="text-sm font-semibold text-gray-900">Google</Text>
                                </>
                            )}
                        </Pressable>

                        {/* Apple Btns */}
                        <Pressable
                            className="flex-1 flex-row items-center justify-center gap-2 bg-white/10 py-4 rounded-2xl border border-white/20 active:scale-[0.97]"
                            disabled={isLoading}
                            accessibilityRole="button"
                            accessibilityLabel="Continue with Apple"
                            onPress={() => !isLoading && handleSocialAuth("oauth_apple")}
                        >
                            {loadingStrategy === "oauth_apple" ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                                    <Text className="text-sm font-semibold text-foreground">Apple</Text>
                                </>
                            )}
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

export default AuthScreen