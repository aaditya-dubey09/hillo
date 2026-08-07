import { Redirect, Tabs } from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";

const TabsLayout = () => {
    const { isSignedIn, isLoaded } = useAuth();

    if (!isLoaded) return null;
    if (!isSignedIn) return <Redirect href="/(auth)" />;

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "#F4A261",
                tabBarInactiveTintColor: "#6B6B70",
                tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: "#0D0D0F",
                    borderTopColor: "#1A1A1D",
                    borderTopWidth: 1,
                    height: 58, // 88 for ios
                    paddingTop: 8,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Chats",
                    tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons 
                            name={focused ? "chatbubbles" : "chatbubbles-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, focused, size }) => (
                        <Ionicons 
                            name={focused ? "person" : "person-outline"}
                            size={size}
                            color={color}
                        />
                    )
                }}
            />
        </Tabs>
    );
};

export default TabsLayout