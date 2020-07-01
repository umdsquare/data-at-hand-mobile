import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity, FlatList, Animated, SectionList, Dimensions, ViewabilityConfig, ViewToken } from 'react-native';
import { Sizes } from '@style/Sizes';
import { SpeechAffordanceIndicator } from './SpeechAffordanceIndicator';
import { SwipedFeedback } from '@components/common/SwipedFeedback';
import Colors from '@style/Colors';
import { BottomSheet } from '@components/common/BottomSheet';
import { Button } from 'react-native-elements';
import { StyleTemplates } from '@style/Styles';
import Haptic from "react-native-haptic-feedback";

import { FlingGestureHandler, Directions, FlingGestureHandlerStateChangeEvent, State, BorderlessButton, LongPressGestureHandler, LongPressGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import { denialAnimationSettings } from '@components/common/Animations';
import { group } from 'd3-array';
import { SvgIcon, SvgIconType } from '@components/common/svg/SvgIcon';

const BOTTOMSHEET_ELEMENT_HEIGHT = Sizes.normalFontSize + 2 * Sizes.verticalPadding
const BOTTOMSHEET_ELEMENT_SECTION_HEADER_HEIGHT = Sizes.smallFontSize + 1.5 * Sizes.horizontalPadding

const LIST_VIEWABILITY_CONFIG = {
    itemVisiblePercentThreshold: 100,
    minimumViewTime: 0,
    waitForInteraction: true
} as ViewabilityConfig

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
    color: Colors.WHITE,
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
        justifyContent: 'flex-end',
        height,
        paddingRight: Sizes.horizontalPadding,
        paddingLeft: Sizes.horizontalPadding,
    },

    valueStyle: valueStyleBase,

    valueStyleLight: {
        ...valueStyleBase,
        color: Colors.textColorLight
    },

    indicatorStyle: {
        marginBottom: Sizes.normalFontSize,
        marginLeft: 3
    },

    bottomSheetHeaderStyle: { justifyContent: 'flex-end', flexDirection: 'row', paddingRight: Sizes.horizontalPadding, borderBottomColor: Colors.textGray, borderBottomWidth: 1 },

    bottomSheetCloseButtonStyle: { padding: Sizes.horizontalPadding },

    bottomSheetElementStyle: {
        ...StyleTemplates.flexHorizontalCenteredListContainer,
        height: BOTTOMSHEET_ELEMENT_HEIGHT,
        paddingLeft: Sizes.horizontalPadding, paddingRight: Sizes.horizontalPadding,
        borderBottomColor: '#00000015',
        borderBottomWidth: 1
    },

    bottomSheetElementTitleStyle: {
        ...valueStyleBase,
        color: Colors.textColorLight,
        flex: 1
    },

    bottomSheetElementDescriptionStyle: {
        color: Colors.textGray
    },

    bottomSheetSectionHeaderStyle: {
        height: BOTTOMSHEET_ELEMENT_SECTION_HEADER_HEIGHT,
        paddingLeft: Sizes.horizontalPadding, paddingRight: Sizes.horizontalPadding,
        backgroundColor: Colors.backPanelColor,
        borderBottomColor: Colors.lightBorderColor,
        borderBottomWidth: 1,
        justifyContent: 'center'
    },

    bottomSheetSectionHeaderTitleStyle: {
        fontSize: Sizes.smallFontSize,
        color: Colors.textGray,
        fontWeight: 'bold',
    },

    bottomSheetListStyle: {
        flexGrow: 0,
        maxHeight: Dimensions.get('window').height * 0.6
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
    values: Array<string>,
    getCategory?: (index: number) => string,
    onPress?: () => void,
    onLongPressIn?: () => void,
    onLongPressOut?: () => void,
    onValueChange?: (newValue: string, newIndex: number, interactionContext: 'swipe' | 'picker') => void,
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
                    prop.onValueChange(prop.values[currentIndex], currentIndex, 'swipe')
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

            if (prop.onLongPressIn) {
                prop.onLongPressIn()
            } else {
                requestAnimationFrame(() => {
                    movement.setValue(0)
                    Animated.timing(movement, denialAnimationSettings.timingConfig).start()
                })
            }
        } else if (ev.nativeEvent.state === State.END || ev.nativeEvent.state === State.CANCELLED) {
            if (prop.onLongPressOut) prop.onLongPressOut()
        }
    }, [prop.onLongPressIn, prop.onLongPressOut])

    const onCloseBottomSheetPress = useCallback(() => {
        bottomSheetRef.current?.close()
    }, [])

    const dataBySection = useMemo(() => {
        if (prop.getCategory != null) {
            const list = prop.values.map((value, index) => ({ value, index, category: prop.getCategory(index) }))
            const grouped = group(list, (v => v.category))
            const result = []
            for (const group of grouped.keys()) {
                result.push({ title: group, data: grouped.get(group) })
            }
            return result
        } else return null
    }, [prop.values, prop.getCategory])

    const renderItem = useCallback(entry => {
        return <TouchableOpacity
            onPress={
                () => {
                    if (prop.onValueChange) {
                        prop.onValueChange(prop.values[entry.index], entry.index, 'picker')
                    }
                    bottomSheetRef.current?.close()
                }
            }
            style={styles.bottomSheetElementStyle}>
            {
                prop.IconComponent != null ? <prop.IconComponent color={Colors.textGray} size={20} {...(prop.iconProps && prop.iconProps(entry.index))} /> : null
            }
            <Text style={styles.bottomSheetElementTitleStyle}>{entry.item}</Text>
            {
                entry.item === prop.value ? <SvgIcon type={SvgIconType.Check} color={Colors.accent} /> : null
            }
        </TouchableOpacity>
    }, [prop.value, prop.onValueChange, prop.iconProps])

    const renderSectionItem = useCallback(entry => renderItem({ item: entry.item.value, index: entry.item.index }), [renderItem])

    const flatListGetItemLayoutFunc = useCallback((_: any, index: number) => {
        return { length: BOTTOMSHEET_ELEMENT_HEIGHT, offset: BOTTOMSHEET_ELEMENT_HEIGHT * index, index }
    }, [])

    /*

    const [viewableItems, setViewableItems] = useState<Array<ViewToken> | null>(null)

    const onViewableItemsChanged = useCallback((args: { viewableItems: Array<ViewToken>, changed: Array<ViewToken> }) => {
        setViewableItems(args.viewableItems)
    }, [])

    const isCurrentValueViewable = useMemo(() => viewableItems?.find(v => v.item.value != null ? (v.item.value === prop.value) : (v.item === prop.value)) != null,
        [prop.value, viewableItems, onViewableItemsChanged])

        console.log("viewable items:", viewableItems, " currentValueViewable: ", isCurrentValueViewable)

        */

    const [movement] = useState(new Animated.Value(0))


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
                    enabled={prop.onLongPressIn != null}
                    onHandlerStateChange={onLongPressStateChange}
                    shouldCancelWhenOutside={false}
                    maxDist={200}>
                    <BorderlessButton onPress={onPress} rippleColor={"rgba(255,255,255,0.2)"} style={StyleTemplates.fillFlex}>
                        <Animated.View style={{
                            ...styles.buttonStyle,
                            transform: [{
                                translateX: movement.interpolate(denialAnimationSettings.interpolationConfig)
                            }]
                        }}>
                            {
                                prop.IconComponent ? <prop.IconComponent
                                    {...{ color: prop.isLightMode === true ? Colors.textGray : Colors.WHITE, size: 20 }}
                                    {...(prop.iconProps && prop.iconProps(prop.values.indexOf(prop.value)))} /> : null
                            }
                            <Text style={prop.isLightMode === true ? styles.valueStyleLight : styles.valueStyle}>{prop.value}</Text>
                            {prop.onLongPressIn != null ?
                                <SpeechAffordanceIndicator overrideStyle={styles.indicatorStyle} /> : null}
                        </Animated.View>
                    </BorderlessButton>
                </LongPressGestureHandler>

                {
                    <BottomSheet ref={bottomSheetRef}>
                        <View style={styles.bottomSheetHeaderStyle}>
                            <Button type="clear" title="Close" buttonStyle={styles.bottomSheetCloseButtonStyle} onPress={onCloseBottomSheetPress} />
                        </View>
                        {
                            dataBySection != null ?
                                <SectionList
                                    initialNumToRender={prop.values.length}
                                    style={styles.bottomSheetListStyle}
                                    sections={dataBySection}
                                    keyExtractor={(item, index) => {
                                        return item?.index?.toString()
                                    
                                    }}
                                    renderItem={renderSectionItem}
                                    getItemLayout={flatListGetItemLayoutFunc}
                                    renderSectionHeader={({ section }) => (
                                        <View style={styles.bottomSheetSectionHeaderStyle}>
                                            <Text style={styles.bottomSheetSectionHeaderTitleStyle}>{section.title}</Text>
                                        </View>
                                    )}
                                />
                                : <FlatList
                                    style={styles.bottomSheetListStyle}
                                    initialNumToRender={prop.values.length}
                                    getItemLayout={flatListGetItemLayoutFunc}
                                    data={prop.values}
                                    keyExtractor={(value, index) => index.toString()}
                                    renderItem={renderItem}
                                />
                        }
                    </BottomSheet>
                }
            </View>
        </FlingGestureHandler>
    </FlingGestureHandler>
})