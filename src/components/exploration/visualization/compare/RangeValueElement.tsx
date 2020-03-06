import React from 'react';
import { IAggregatedRangeValue } from '../../../../core/exploration/data/types';
import { Rect } from 'react-native-svg';
import { ScaleBand, ScaleLinear } from 'd3-scale';
import Colors from '../../../../style/Colors';
import { SingleValueElement } from './SingleValueElement';
import { TouchableGroup } from './TouchableGroup';

export const RangeValueElement = (props: {
    scaleY: ScaleLinear<number, number>,
    scaleX: ScaleBand<number>,
    value: IAggregatedRangeValue,
    onClick?: (timeKey: number) => void,
    onLongPressIn?: (timeKey: number, x: number, y: number, screenX: number, screenY: number, touchId: string) => void,
    onLongPressOut?: (timeKey: number, x: number, y: number, screenX: number, screenY: number) => void
}) => {

    let connectionWidth = Math.min(40, props.scaleX.bandwidth())

    const feedbackArea = {
        x: props.scaleX(props.value.timeKey)! + props.scaleX.bandwidth() * .5 - props.scaleX.step() * .5,
        y: 0,
        width: props.scaleX.step(),
        height: Math.abs(props.scaleY(props.scaleY.domain()[0]) - props.scaleY(props.scaleY.domain()[1]))
    }

    return <TouchableGroup
        onClick={() => props.onClick && props.onClick(props.value.timeKey)}
        onLongPressIn={(x, y, screenX, screenY, touchId) => props.onLongPressIn && props.onLongPressIn(props.value.timeKey, x, y, screenX, screenY, touchId)}
        onLongPressOut={(x, y, screenX, screenY) => props.onLongPressOut && props.onLongPressOut(props.value.timeKey, x, y, screenX, screenY)}
        feedbackArea={feedbackArea}>

        <Rect fill="#BEBEBE50" rx={connectionWidth * 0.1}
            x={props.scaleX(props.value.timeKey)! + (props.scaleX.bandwidth() - connectionWidth) * 0.5}
            y={props.scaleY(Math.min(props.value.avgA, props.value.avgB))}
            width={connectionWidth}
            height={Math.abs(props.scaleY(props.value.avgA) - props.scaleY(props.value.avgB))}
            stroke="#70707020"
            strokeWidth={1}
        />

        <SingleValueElement scaleX={props.scaleX} scaleY={props.scaleY} value={
            {
                min: props.value.minA,
                max: props.value.maxA,
                avg: props.value.avgA,
                timeKey: props.value.timeKey,
                sum: 0,
                n: props.value.n
            }
        } additionalPadding={0.1} maxWidth={30} rangeColor={Colors.chartRangeAColor} />

        <SingleValueElement scaleX={props.scaleX} scaleY={props.scaleY} value={
            {
                min: props.value.minB,
                max: props.value.maxB,
                avg: props.value.avgB,
                timeKey: props.value.timeKey,
                sum: 0,
                n: props.value.n
            }
        } additionalPadding={0.1} maxWidth={30} rangeColor={Colors.chartRangeBColor} />

    </TouchableGroup >
}