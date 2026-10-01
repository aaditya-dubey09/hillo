import { Message } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

function MessageBubble({ message, isFromMe }: { message: Message; isFromMe: boolean }) {
    const time = message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' }) : "";

    return (
        <View className={`flex-row ${isFromMe ? "justify-end" : "justify-start"}`}>
            <View
                className={`max-w-[80%] px-3 py-2 rounded-b-2xl ${isFromMe
                    ? "bg-primary rounded-l-2xl"
                    : "bg-surface-card rounded-r-2xl border border-surface-light/50"
                    }`}
            >
                <View className="flex-col items-end justify-between">
                    <Text className={`text-sm ${isFromMe ? "text-surface-dark" : "text-foreground"}`}>
                        {message.text}
                    </Text>
                    <View className="mt-1">
                        <Text className={`text-xs text-right ${isFromMe ? "inline-flex gap-1 text-[#0D0D0F]/80" : "text-foreground/50"}`}>{time}
                            {isFromMe &&
                                <Ionicons name="checkmark-done" size={14} className="opacity-70" />
                            }</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

export default MessageBubble;