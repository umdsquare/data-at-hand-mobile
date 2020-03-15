import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity, FlatList } from 'react-native';
import { Sizes } from '@style/Sizes';
import { SpeechAffordanceIndicator } from './SpeechAffordanceIndicator';
import GestureRecognizer from 'react-native-swipe-gestures';
import { SwipedFeedback } from '../common/SwipedFeedback';
import Colors from '@style/Colors';
import { BottomSheet } from '../common/BottomSheet';
import { Button } from 'react-native-elements';
import { StyleTemplates } from '@style/Styles';
import Haptic from "react-native-haptic-feedback";

import { FlingGestureHandler, Directions, FlingGestureHandlerStateChangeEvent, State, BorderlessButton, LongPressGestureHandler, LongPressGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
const height = 50
const containerStyleBase = {
    flexDirection: 'row',
    alignItems: 'center',
    height,
    paddingLeft: Sizes.horizontalPadding,
    justifyContent: 'space-between'
} as ViewStyle

const titleStyleBase = {
    fontSize: Sizes.normalFontSize,
    color: "#E0E0E0",
} as TextStyle

const valueStyleBase = {
    color: 'white',
    fontSize: Sizes.normalFontSize,
    fontWeight: '500',
    marginLeft: 4,
} as TextStyle

const styles = StyleSheet.create({
    containerStyleWithBorder: {
        ...containerStyleBase as any,
        borderBottomColor: Colors.lightBorderColor,
        borderBottomWidth: 1
    },
    containerStyleWithoutBorder: containerStyleBase as any,

    titleStyle: titleStyleBase,
    titleStyleLight: {
        ...titleStyleBase,
        color: Colors.textGray
    },

    buttonStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        height,
        paddingRight: Sizes.horizontalPadding,
        paddingLeft: Sizes.horizontalPadding,
    },

    valueStyle: valueStyleBase,

    valueStyelLight: {
        ...valueStyleBase,
        color: Colors.textColorLight
    },

    indicatorStyle: {
        marginBottom: Sizes.normalFontSize,
        marginLeft: 3
    }
})

export interface CategoricalRowProps {
    title: string,
    showSpeechAffordance?: boolean,
    value: string,
    IconComponent?: any,
    iconProps?: (index: number) => any,
    showBorder?: boolean,
    children?: any,
    isLightMode?: boolean,
    values: string[],
    useSpeechIndicator?: boolean,
    onPress?: () => void,
    onLongPressIn?: () => void,
    onLongPressOut?: () => void,
    onValueChange?: (newValue: string, newIndex: number) => void,
}

export const CategoricalRow = React.memo((prop: CategoricalRowProps) => {
    const swipedFeedbackRef = useRef<SwipedFeedback>(null)
    const bottomSheetRef = useRef<BottomSheet>(null)

    const makeFlingGestureStateChangeHandler = useMemo(() => (direction: "left" | "right") => {
        return (ev: FlingGestureHandlerStateChangeEvent) => {
            if (ev.nativeEvent.state === State.ACTIVE) {
                let currentIndex = prop.values.indexOf(prop.value)
                if (direction === 'left') {
                    if (currentIndex === 0) {
                        currentIndex = prop.values.length - 1
                    } else currentIndex--
                } else {
                    currentIndex = (currentIndex + 1) % prop.values.length
                }

                if (prop.onValueChange) {
                    prop.onValueChange(prop.values[currentIndex], currentIndex)
                }
                swipedFeedbackRef.current?.startFeedback(direction)
            }
        }
    }, [prop.values, prop.value, prop.onValueChange])

    const onFlingLeftGestureStateChange = useCallback(makeFlingGestureStateChangeHandler('left'), [makeFlingGestureStateChangeHandler])
    const onFlingRightGestureStateChange = useCallback(makeFlingGestureStateChangeHandler('right'), [makeFlingGestureStateChangeHandler])

    const onPress = useCallback(() => {
        bottomSheetRef.current?.open()
        if (prop.onPress)
            prop.onPress()
    }, [prop.onPress])

    const onLongPressStateChange = useCallback((ev: LongPressGestureHandlerStateChangeEvent) => {
        if (ev.nativeEvent.state === State.ACTIVE) {
            Haptic.trigger("impactHeavy", {
                enableVibrateFallback: true,
                ignoreAndroidSystemSettings: true
            })

            if (prop.onLongPressIn) prop.onLongPressIn()
        } else if (ev.nativeEvent.state === State.END || ev.nativeEvent.state === State.CANCELLED) {
            if (prop.onLongPressOut) prop.onLongPressOut()
        }
    }, [prop.onLongPressIn, prop.onLongPressOut])

    return <FlingGestureHandler
        direction={Directions.LEFT}
        onHandlerStateChange={onFlingLeftGestureStateChange}
    >
        <FlingGestureHandler
            direction={Directions.RIGHT}
            onHandlerStateChange={onFlingRightGestureStateChange}
        >
            <View style={prop.showBorder === true ? styles.containerStyleWithBorder : styles.containerStyleWithoutBorder}>
                <SwipedFeedback ref={swipedFeedbackRef} />
                <Text style={prop.isLightMode === true ? styles.titleStyleLight : styles.titleStyle}>{prop.title}</Text>
                <LongPressGestureHandler
                    onHandlerStateChange={onLongPressStateChange}
                    shouldCancelWhenOutside={false}
                    maxDist={200}>
                    <BorderlessButton style={styles.buttonStyle} onPress={onPress} rippleColor={"rgba(255,255,255,0.2)"}>
                        {
                            prop.IconComponent ? <prop.IconComponent
                                {...{ color: prop.isLightMode === true ? Colors.textGray : 'white', size: 20 }}
                                {...(prop.iconProps && prop.iconProps(prop.values.indexOf(prop.value)))} /> : null
                        }
                        <Text style={prop.isLightMode === true ? styles.valueStyelLight : styles.valueStyle}>{prop.value}</Text>
                        {prop.useSpeechIndicator !== false ?
                            <SpeechAffordanceIndicator overrideStyle={styles.indicatorStyle} /> : null}
                    </BorderlessButton>
                </LongPressGestureHandler>

                {
                    <BottomSheet ref={bottomSheetRef}>
                        <View style={{ justifyContent: 'flex-end', flexDirection: 'row', paddingRight: Sizes.horizontalPadding, borderBottomColor: Colors.textGray, borderBottomWidth: 1 }}>
                            <Button type="clear" title="Close" buttonStyle={{ padding: Sizes.horizontalPadding }} onPress={() => { bottomSheetRef.current?.close() }} />
                        </View>
                        <FlatList
                            style={{ flexGrow: 0 }}
                            initialNumToRender={prop.values.length}
                            data={prop.values}
                            keyExtractor={(value, index) => index.toString()}
                            renderItem={(entry => {
                                return <TouchableOpacity
                                    onPress={
                                        () => {
                                            if (prop.onValueChange) {
                                                prop.onValueChange(prop.values[entry.index], entry.index)
                                            }
                                            bottomSheetRef.current?.close()
                                        }
                                    }
                                    style={{
                                        ...StyleTemplates.flexHorizontalCenteredListContainer,
                                        paddingLeft: Sizes.horizontalPadding, paddingRight: Sizes.horizontalPadding,
                                        paddingTop: Sizes.verticalPadding, paddingBottom: Sizes.verticalPadding,
                                        borderBottomColor: '#00000015',
                                        borderBottomWidth: 1
                                    }}>
                                    {
                                        prop.IconComponent ? <prop.IconComponent {...{ color: Colors.textGray, size: 20 }} {...(prop.iconProps && prop.iconProps(entry.index))} /> : null
                                    }
                                    <Text style={styles.valueStyelLight}>{entry.item}</Text>
                                </TouchableOpacity>
                            })}
                        />
                    </BottomSheet>
                }
            </View>
        </FlingGestureHandler>
    </FlingGestureHandler>


    return <GestureRecognizer
        onSwipeLeft={prop.values ? () => {
            let currentIndex = prop.values.indexOf(prop.value)
            if (currentIndex === 0) {
                currentIndex = prop.values.length - 1
            } else currentIndex--

            if (prop.onValueChange) {
                prop.onValueChange(prop.values[currentIndex], currentIndex)
            }
            swipedFeedbackRef.current?.startFeedback('left')
        } : undefined}

        onSwipeRight={prop.values ? () => {
            let currentIndex = prop.values.indexOf(prop.value)
            currentIndex = (currentIndex + 1) % prop.values.length

            if (prop.onValueChange) {
                prop.onValueChange(prop.values[currentIndex], currentIndex)
            }
            swipedFeedbackRef.current?.startFeedback('right')
        } : undefined}
        style={prop.showBorder === true ? styles.containerStyleWithBorder : styles.containerStyleWithoutBorder}>
        {
            prop.values != null ? <SwipedFeedback ref={swipedFeedbackRef} /> : null
        }

    </GestureRecognizer>
})