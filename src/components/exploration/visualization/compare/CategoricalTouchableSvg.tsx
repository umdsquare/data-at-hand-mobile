import React from 'react';
import { LayoutRectangle } from "react-native";
import { ScaleBand } from "d3-scale";
import { useMemo, useRef, useState, useCallback } from "react";
import { LongPressGestureHandler, LongPressGestureHandlerStateChangeEvent, State, TapGestureHandlerStateChangeEvent, TapGestureHandler } from "react-native-gesture-handler";
import Svg, { Rect, G } from "react-native-svg";

export const CategoricalTouchableSvg = React.memo((props: {
    chartContainerWidth: number,
    chartContainerHeight: number,
    chartArea: LayoutRectangle,
    scaleX: ScaleBand<number>,
    onLongPressIn: (timeKey, x, y, screenX, screenY, touchId) => void,
    onLongPressMove: (timeKey, x, y, screenX, screenY, touchId) => void,
    onLongPressOut: () => void,
    onClickElement: (timeKey: number) => void,
    children?: any
}) => {

    const hitSlop = useMemo(() => {
        return {
            left: props.chartArea.x,
            right: props.chartContainerWidth - props.chartArea.x - props.chartArea.width,
            top: props.chartArea.y,
            bottom: props.chartContainerHeight - props.chartArea.height - props.chartArea.y
        }
    }, [props.chartArea, props.chartContainerWidth, props.chartContainerHeight])


    const longPressRef = useRef<LongPressGestureHandler>()

    const [currentTouchedIndex, setCurrentTouchedIndex] = useState<number | null>(null)

    const updateTouchedIndex = useMemo(() => {
        return (viewX: number) => {
            const localX = viewX - props.chartArea.x
            const index = Math.max(0, Math.min(props.scaleX.domain().length - 1, Math.floor(localX / props.scaleX.step())))
            if (index !== currentTouchedIndex) {
                setCurrentTouchedIndex(index)
            }
        }
    }, [props.scaleX, props.chartArea, currentTouchedIndex, setCurrentTouchedIndex])

    const releaseTooltipTouch = useMemo(() => {
        return () => {
            setCurrentTouchedIndex(null)
        }
    }, [setCurrentTouchedIndex])

    const onLongPressHandlerStateChange = useCallback((ev: LongPressGestureHandlerStateChangeEvent) => {
        console.log("update: ", updateTouchedIndex)
        if (ev.nativeEvent.state === State.ACTIVE) {
            updateTouchedIndex(ev.nativeEvent.x)
            props.onLongPressIn(currentTouchedIndex,
                ev.nativeEvent.x, ev.nativeEvent.y, ev.nativeEvent.absoluteX, ev.nativeEvent.absoluteY,
                ev.nativeEvent.handlerTag.toString())
        }
        if (ev.nativeEvent.state === State.END) {
            releaseTooltipTouch()
            props.onLongPressOut()
        }
    }, [updateTouchedIndex, props.onLongPressIn, currentTouchedIndex, releaseTooltipTouch, props.onLongPressOut])

    const onTapHandlerStateChange = useCallback((ev: TapGestureHandlerStateChangeEvent) => {
        if (ev.nativeEvent.state === State.BEGAN) {
            updateTouchedIndex(ev.nativeEvent.x)
        }
        if (ev.nativeEvent.state === State.ACTIVE) {
            console.log("tabbed! at ", ev.nativeEvent.absoluteX, ev.nativeEvent.absoluteY)
            props.onClickElement(currentTouchedIndex)
            setCurrentTouchedIndex(null)
        }
    }, [updateTouchedIndex, props.onClickElement, currentTouchedIndex, setCurrentTouchedIndex])

    return <TapGestureHandler
        onHandlerStateChange={onTapHandlerStateChange}
        shouldCancelWhenOutside={false}
        hitSlop={hitSlop}
    >
        <LongPressGestureHandler
            ref={longPressRef}
            maxDist={Number.MAX_VALUE}
            onHandlerStateChange={onLongPressHandlerStateChange}
            onGestureEvent={(ev) => {
                const localX = ev.nativeEvent.x - props.chartArea.x
                const index = Math.max(0, Math.min(props.scaleX.domain().length - 1, Math.floor(localX / props.scaleX.step())))
                if (currentTouchedIndex != index) {
                    setCurrentTouchedIndex(index)
                    props.onLongPressMove(index,
                        ev.nativeEvent.x, ev.nativeEvent.y, ev.nativeEvent.absoluteX, ev.nativeEvent.absoluteY,
                        ev.nativeEvent.handlerTag.toString())
                }
            }}
        >
            <Svg width={props.chartContainerWidth} height={props.chartContainerHeight}>
                <Rect {...props.chartArea} />
                <G x={props.chartArea.x} y={props.chartArea.y}>
                    {
                        currentTouchedIndex != null ?
                            <Rect fill="rgba(0,0,0,0.07)"
                                x={props.scaleX(currentTouchedIndex) + props.scaleX.bandwidth() * .5 - props.scaleX.step() * .5}
                                width={props.scaleX.step()}
                                height={props.chartArea.height} /> : null
                    }
                </G>
                {
                    props.children
                }
            </Svg>
        </LongPressGestureHandler>
    </TapGestureHandler>
})