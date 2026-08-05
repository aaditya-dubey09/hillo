import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

export interface MenuItem {
    icon: string;
    label: string;
    color: string;
    value?: string;
    actionKey?: string;
    disabled?: boolean;
    isExternal?: boolean; // Controls icon display for external links
}

interface MenuItemRowProps {
    item: MenuItem;
    isLast: boolean;
    onPress: (actionKey?: string) => void;
}

export const MenuItemRow = ({ item, isLast, onPress }: MenuItemRowProps) => {
    const isInteractive = !item.disabled && Boolean(item.actionKey);

    return (
        <Pressable
            disabled={!isInteractive}
            className={`flex-row items-center px-4 py-3.5 ${
                isInteractive ? "active:bg-surface-light" : "opacity-60"
            } ${!isLast ? "border-b border-surface-light" : ""}`}
            onPress={() => onPress(item.actionKey)}
        >
            <View
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${item.color}20` }}
            >
                <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text className="flex-1 ml-3 text-foreground font-medium">{item.label}</Text>
            {item.value && (
                <Text className="text-subtle-foreground text-sm mr-1">{item.value}</Text>
            )}

            {isInteractive && (
                <Ionicons
                    name={item.isExternal ? "open-outline" : "chevron-forward"}
                    size={item.isExternal ? 16 : 18}
                    color="#6B6B70"
                />
            )}
        </Pressable>
    );
};