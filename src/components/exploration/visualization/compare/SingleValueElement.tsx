import React from 'react';
import { IAggregatedValue } from '../../../../core/exploration/data/types';
import { G, Rect, Line } from 'react-native-svg';
import { ScaleBand, ScaleLinear } from 'd3-scale';
import Colors from '../../../../style/Colors';
import { TouchableGroup } from './TouchableGroup';

export const SingleValueElement = (props: {
    scaleY: ScaleLinear<number, number>,
    scaleX: ScaleBand<number>,
    value: IAggregatedValue,
    additionalPadding?: number,
    rangeColor?: string,
    maxWidth?: number,
    onClick?: (timeKey: number) => void,
    onLongPressIn?: (timeKey: number, x: number, y: number, screenX: number, screenY: number, touchId: string) => void,
    onLongPressOut?: (timeKey: number, x: number, y: number, screenX: number, screenY: number) => void
}) => {

    const bandPadding = props.additionalPadding || 0
    let x1 = props.scaleX(props.value.timeKey)! + bandPadding * props.scaleX.bandwidth()
    let x2 = x1 + props.scaleX.bandwidth() - 2 * bandPadding * props.scaleX.bandwidth()

    if (props.maxWidth && props.maxWidth < x2 - x1) {
        x1 = x1 + (x2 - x1 - props.maxWidth) / 2
        x2 = x1 + props.maxWidth
    }

    if (props.onClick != null || props.onLongPressIn != null || props.onLongPressOut != null) {
        return <TouchableGroup
            onClick={() => props.onClick && props.onClick(props.value.timeKey)}
            onLongPressIn={(x, y, screenX, screenY, touchId) => props.onLongPressIn && props.onLongPressIn(props.value.timeKey, x, y, screenX, screenY, touchId)}
            onLongPressOut={(x, y, screenX, screenY) => props.onLongPressOut && props.onLongPressOut(props.value.timeKey, x, y, screenX, screenY)}
            feedbackArea={{
                x: props.scaleX(props.value.timeKey)! + props.scaleX.bandwidth() * .5 - props.scaleX.step() * .5,
                y: props.scaleY(Math.max(props.scaleY.domain()[0], props.scaleY.domain()[1])),
                width: props.scaleX.step(),
                height: Math.abs(props.scaleY(props.scaleY.domain()[0]) - props.scaleY(props.scaleY.domain()[1]))
            }}
        >

            <Rect x={x1} y={props.scaleY(props.value.max)}
                width={x2 - x1} height={props.scaleY(props.value.min) - props.scaleY(props.value.max)}
                fill={props.rangeColor || Colors.chartRangeColor}
            />
            <Line x1={x1} x2={x2} y={props.scaleY(props.value.avg)} stroke={Colors.textColorDark} strokeWidth={2} strokeDasharray={"1.5"} />
            <Line x1={x1} x2={x2} y={props.scaleY(props.value.max)} stroke={Colors.chartLightText} />
            <Line x1={x1} x2={x2} y={props.scaleY(props.value.min)} stroke={Colors.chartLightText} />
        </TouchableGroup>
    } else return <G>
        <Rect x={x1} y={props.scaleY(props.value.max)}
            width={x2 - x1} height={props.scaleY(props.value.min) - props.scaleY(props.value.max)}
            fill={props.rangeColor || Colors.chartRangeColor}
        />
        <Line x1={x1} x2={x2} y={props.scaleY(props.value.avg)} stroke={Colors.textColorDark} strokeWidth={2} strokeDasharray={"1.5"} />
        <Line x1={x1} x2={x2} y={props.scaleY(props.value.max)} stroke={Colors.chartLightText} />
        <Line x1={x1} x2={x2} y={props.scaleY(props.value.min)} stroke={Colors.chartLightText} />
    </G>
}