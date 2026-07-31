import { ScrollView, Text } from 'react-native'
import React from 'react'

const ProfileTab = () => {
    return (
        <ScrollView
            className="bg-surface"
            contentInsetAdjustmentBehavior="automatic" // for ios
        >
            <Text className="text-white">ChatTab</Text>
        </ScrollView>
    );
};

export default ProfileTab