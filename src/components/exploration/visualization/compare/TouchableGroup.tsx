import React, { useState } from 'react';
import { G, Rect } from 'react-native-svg';
import { LayoutRectangle, Animated } from 'react-native';

const AnimatedRect = Animated.createAnimatedComponent(Rect)

export const TouchableGroup = (prop: {
    onClick: () => void,
    onLongPressIn: () => void,
    onLongPressOut: () => void,
    children?: any,
    feedbackArea?: LayoutRectangle
}) => {

    const [isLongPressed, setIsLongPressed] = useState(false)
    const [feedbackColor, _] = useState(new Animated.Value(0))

    return <G
        onPress={prop.onClick}
        onLongPress={() => {
            setIsLongPressed(true)
            prop.onLongPressIn()
        }}
        onPressIn={() => {
            Animated.timing(feedbackColor, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
            }).start()
        }}
        onPressOut={() => {
            if (isLongPressed === true) {
                prop.onLongPressOut()
            }
            setIsLongPressed(false)
            feedbackColor.setValue(1)
            Animated.timing(feedbackColor, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            }).start()
        }}
        >
        {
            prop.feedbackArea != null ? <AnimatedRect {...prop.feedbackArea}
                fill="#00000010"
                opacity={feedbackColor.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1]
                }) as any} /> : null
        }
        {prop.children}
    </G>
}