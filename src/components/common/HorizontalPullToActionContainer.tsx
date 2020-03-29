import React, { useMemo, useCallback, useState } from 'react';
import { PanGestureHandler, State, PanGestureHandlerStateChangeEvent } from "react-native-gesture-handler"
import { Dimensions, View, ViewStyle, StyleSheet, Text } from "react-native"
import { Sizes } from '@style/Sizes';
import Svg, { Circle } from 'react-native-svg';
import Animated, { Easing } from 'react-native-reanimated';
import Colors from '@style/Colors';

const AnimatedSvgCircle = Animated.createAnimatedComponent(Circle)

const styles = StyleSheet.create({
    indicatorStyleBase: {
        width: 150,
        height: 150,
        borderRadius: 100,
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center'
    },
    indicatorContainerStyle: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        backgroundColor: 'red',
        flexDirection: 'row',
        alignItems: 'center',
    },
    indicatorContentContainer: {
        width: '50%',
        position: 'absolute',
        alignItems: 'center'
    },
    indicatorTextStyle: {
        fontSize: Sizes.tinyFontSize,
        fontWeight: 'bold',
        color: Colors.WHITE,
        textAlign: 'center',
        marginTop: 8,
        marginRight: 4,
        marginLeft: 4
    }
})

export const HorizontalPullToActionContainer = React.memo((props: {
    style: ViewStyle,
    onPulled: (from: 'left' | 'right') => void,
    enabled?: boolean,
    children?: any
}) => {
    const bezelRegion = useMemo(() => -(Dimensions.get('window').width * 0.8), [])
    const minDragAmount = useMemo(() => (Dimensions.get('window').width * 0.3), [])
    const minDist = useMemo(() => 10, [])

    const [currentPullingOrigin, setPullingOrigin] = useState<'left' | 'right' | null>(null)

    const pullIndicatorTransformAmount = useMemo(() => new Animated.Value<number>(0), [])

    const onPanGestureEvent = useCallback(Animated.event([{
        nativeEvent: {
            translationX: (x: number) => Animated.set(pullIndicatorTransformAmount, x)
        }
    }]), [])

    const defaultProps = useMemo(() => {
        return {
            minDist,
            enabled: props.enabled || true,
            onGestureEvent: onPanGestureEvent
        }
    }, [minDist, props.enabled, onPanGestureEvent])

    const createHandlerStateChangeCallback = useMemo(() => {
        return (from: 'left' | 'right') => {
            return (ev: PanGestureHandlerStateChangeEvent) => {
                if (ev.nativeEvent.state === State.BEGAN) {
                    setPullingOrigin(from)
                }

                if (ev.nativeEvent.state === State.END && (Math.abs(ev.nativeEvent.translationX) >= minDragAmount || Math.abs(ev.nativeEvent.velocityX) > 300)) {
                    props.onPulled(from)
                }

                if (ev.nativeEvent.state === State.END || ev.nativeEvent.state === State.CANCELLED || ev.nativeEvent.state === State.FAILED) {
                    Animated.timing(pullIndicatorTransformAmount, {
                        toValue: 0,
                        duration: 600,
                        easing: Easing.out(Easing.cubic)
                    }).start(() => {
                        setPullingOrigin(null)
                    })
                }
            }
        }
    }, [minDragAmount, props.onPulled])

    const fromRightHandlerStateChange = useCallback(createHandlerStateChangeCallback('right'), [minDragAmount, props.onPulled])
    const fromLeftHandlerStateChange = useCallback(createHandlerStateChangeCallback('left'), [minDragAmount, props.onPulled])

    return <PanGestureHandler
        {...defaultProps}
        hitSlop={{ left: bezelRegion }}
        onHandlerStateChange={fromRightHandlerStateChange}
    >
        <Animated.View style={props.style}>
            <PanGestureHandler

                {...defaultProps}
                hitSlop={{ right: bezelRegion }}
                onHandlerStateChange={fromLeftHandlerStateChange}
            >

                <Animated.View style={props.style}>
                    {props.children}
                    <View pointerEvents="none" style={{
                        ...styles.indicatorContainerStyle,
                        opacity: currentPullingOrigin ? 1 : 0,
                        left: currentPullingOrigin === 'left' ? 0 : undefined,
                        right: currentPullingOrigin === 'right' ? 0 : undefined,
                    }}>
                        <Animated.View pointerEvents={'none'} style={{
                            ...styles.indicatorStyleBase,
                            left: currentPullingOrigin === 'right' ? 0 : undefined,
                            right: currentPullingOrigin === 'left' ? 0 : undefined,
                            transform: [{
                                translateX: pullIndicatorTransformAmount.interpolate({
                                    inputRange: currentPullingOrigin === 'left' ? [0, minDragAmount] : [-minDragAmount, 0],
                                    outputRange: currentPullingOrigin === 'left' ? [0, styles.indicatorStyleBase.width * .5] : [-styles.indicatorStyleBase.width * .5, 0],
                                    extrapolateLeft: Animated.Extrapolate.CLAMP,
                                    extrapolateRight: Animated.Extrapolate.CLAMP
                                })
                            }]
                        } as any}>
                            <View style={{
                                ...styles.indicatorContentContainer,
                                left: currentPullingOrigin === 'left' ? undefined : 0,
                                right: currentPullingOrigin === 'right' ? undefined : 0,
                            }}>
                                <Svg width="30" height="30" pointerEvents="none">
                                    <Circle stroke={Colors.WHITE} strokeWidth={1} x={15} y={15} r={14.5} />
                                    <AnimatedSvgCircle fill={Colors.WHITE} x={15} y={15} r={Animated.multiply(14, pullIndicatorTransformAmount.interpolate({
                                        inputRange: currentPullingOrigin === 'left' ? [0, minDragAmount] : [-minDragAmount, 0],
                                        outputRange: currentPullingOrigin === 'left' ? [0, 1] : [1, 0],
                                        extrapolateLeft: Animated.Extrapolate.CLAMP,
                                        extrapolateRight: Animated.Extrapolate.CLAMP
                                    }))} />
                                </Svg>
                                <Text style={styles.indicatorTextStyle}>{currentPullingOrigin === 'left' ? "Shift to Past" : "Shift to Future"}</Text>
                            </View>
                        </Animated.View>
                    </View>
                </Animated.View>
            </PanGestureHandler>
        </Animated.View>
    </PanGestureHandler>
})