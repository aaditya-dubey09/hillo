import { Message } from "@/src/types";
import { View, Text } from "react-native";

export const formatMessageTime = (isoString: string) => {
    if (!isoString) return '';

    const date = new Date(isoString);

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
};


function MessageBubble({ message, isFromMe }: { message: Message; isFromMe: boolean }) {
    return (
        <View className={`flex-row ${isFromMe ? "justify-end" : "justify-start"}`}>
            <View
                className={`max-w-[80%] px-3 py-2 rounded-2xl ${isFromMe
                    ? "bg-primary rounded-br-sm"
                    : "bg-surface-card rounded-bl-sm border border-surface-light"
                    }`}
            >
                <View className="flex-col items-end justify-between">
                    <Text className={`text-sm ${isFromMe ? "text-surface-dark" : "text-foreground"}`}>
                        {message.text}
                    </Text>
                    <Text className={`text-[8px] ${isFromMe ? "text-surface-dark/80" : "text-foreground/50"}`}>
                        {formatMessageTime(message.updatedAt)}
                    </Text>
                </View>
            </View>
        </View>
    );
}

export default MessageBubble;