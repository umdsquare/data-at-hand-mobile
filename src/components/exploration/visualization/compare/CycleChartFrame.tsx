import React, { useMemo, useRef, useState, useCallback } from 'react';
import { LayoutRectangle, Text } from "react-native"
import Svg, { G, Line, Text as SvgText, Rect } from "react-native-svg"
import Colors from "../../../../style/Colors"
import { Sizes } from "../../../../style/Sizes"
import { ScaleBand, ScaleLinear } from "d3-scale"
import { TapGestureHandler, State, LongPressGestureHandler, PanGestureHandler, LongPressGestureHandlerStateChangeEvent, TapGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';

export const CycleChartFrame = (props: {
    chartContainerWidth: number,
    chartContainerHeight: number,
    chartArea: LayoutRectangle,
    cycleDomain: number[],
    xTickFormat: (num: number) => string,
    scaleX: ScaleBand<number>,
    scaleY: ScaleLinear<number, number>,
    ticks?: number[],
    yTickFormat?: (num: number) => string,
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
                if(currentTouchedIndex != index){
                setCurrentTouchedIndex(index)
                props.onLongPressMove(index,
                    ev.nativeEvent.x, ev.nativeEvent.y, ev.nativeEvent.absoluteX, ev.nativeEvent.absoluteY,
                    ev.nativeEvent.handlerTag.toString())
                }
            }}
        >
            <Svg width={props.chartContainerWidth} height={props.chartContainerHeight}>
                <Rect {...props.chartArea} />
                <G x={props.chartArea.x} y={props.chartArea.y + props.chartArea.height}>
                    <Line x1={0} x2={props.chartArea.width} y={0} stroke={Colors.textColorDark} strokeWidth={0.5} />
                    {
                        props.cycleDomain.map(dimension => <G
                            key={dimension}
                            y={12}
                            x={props.scaleX(dimension)! + props.scaleX.bandwidth() * .5}><SvgText
                                textAnchor={props.cycleDomain.length > 10 ? "end" : "middle"}
                                alignmentBaseline="hanging"
                                fontSize={Sizes.smallFontSize}
                                fill={Colors.textColorLight}
                                transform={props.cycleDomain.length > 10 ? "rotate(-90)translate(0," + -(Sizes.smallFontSize / 2) + ")" : undefined}
                            >{props.xTickFormat(dimension)}</SvgText></G>)
                    }
                </G>
                <G x={props.chartArea.x} y={props.chartArea.y}>
                    {
                        (props.ticks || props.scaleY.ticks()).map(tick => {
                            return <G key={tick} x={0} y={props.scaleY(tick)}>
                                <SvgText textAnchor="end"
                                    fill={Colors.chartElementDefault} alignmentBaseline="central" x={-8}>{props.yTickFormat ? props.yTickFormat(tick) : tick}</SvgText>
                                <Line x1={0} x2={props.chartArea.width} y={0} stroke={Colors.chartAxisLightColor} /></G>
                        })
                    }
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
}