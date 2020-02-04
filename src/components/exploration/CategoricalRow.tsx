import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sizes } from '../../style/Sizes';
import { SpeechAffordanceIndicator } from './SpeechAffordanceIndicator';
import { TouchableOpacity } from 'react-native-gesture-handler';
import GestureRecognizer from 'react-native-swipe-gestures';
import { SwipedFeedback } from '../common/SwipedFeedback';
const height = 50
const containerStyleBase = {
    flexDirection: 'row',
    alignItems: 'center',
    height,
    paddingLeft: Sizes.horizontalPadding,
}
const styles = StyleSheet.create({
    containerStyleWithBorder: {
        ...containerStyleBase as any,
        borderBottomColor: "#FFFFFF25",
        borderBottomWidth: 1
    },
    containerStyleWithoutBorder: containerStyleBase as any,

    titleStyle: {
        fontSize: Sizes.normalFontSize,
        color: "#E0E0E0",
        flex: 1
    },

    buttonStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        height,
        paddingRight: Sizes.horizontalPadding,
        paddingLeft: Sizes.horizontalPadding,
    },

    valueStyle: {
        color: 'white',
        fontSize: Sizes.normalFontSize,
        fontWeight: '500',
        marginLeft: 4
    },

    indicatorStyle: {
        marginBottom: Sizes.normalFontSize,
        marginLeft: 3
    }
})

export const CategoricalRow = (prop: {
    title: string,
    showSpeechAffordance?: boolean,
    value?: string,
    icon?: any,
    showBorder?: boolean,
    children?: any,
    onPress?: () => void,
    onSwipeLeft?: () => void,
    onSwipeRight?: () => void
}) => {

    let swipedFeedbackRef: SwipedFeedback

    return <GestureRecognizer
        onSwipeLeft={prop.onSwipeLeft != null ? () => {
            prop.onSwipeLeft()
            swipedFeedbackRef.startFeedback('left')
        } : null}
        onSwipeRight={prop.onSwipeRight != null ? () => {
            prop.onSwipeRight()
            swipedFeedbackRef.startFeedback('right')
        } : null} style={prop.showBorder === true ? styles.containerStyleWithBorder : styles.containerStyleWithoutBorder}>
        {
            (prop.onSwipeLeft != null || prop.onSwipeRight != null) ? <SwipedFeedback ref={ref => swipedFeedbackRef = ref} /> : null
        }
        <Text style={styles.titleStyle}>{prop.title}</Text>
        <TouchableOpacity style={styles.buttonStyle} onPress={prop.onPress}>
            {prop.icon}
            <Text style={styles.valueStyle}>{prop.value}</Text>
            <SpeechAffordanceIndicator overrideStyle={styles.indicatorStyle} />
        </TouchableOpacity>
    </GestureRecognizer>
}