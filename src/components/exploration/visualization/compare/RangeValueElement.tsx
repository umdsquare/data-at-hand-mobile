import React from 'react';
import { IAggregatedValue, IAggregatedRangeValue } from '../../../../core/exploration/data/types';
import { G, Rect, Line } from 'react-native-svg';
import { ScaleBand, ScaleLinear } from 'd3-scale';
import Colors from '../../../../style/Colors';
import { SingleValueElement } from './SingleValueElement';
import { TouchableGroup } from './TouchableGroup';

export const RangeValueElement = (props: {
    scaleY: ScaleLinear<number, number>,
    scaleX: ScaleBand<number>,
    value: IAggregatedRangeValue,
    onClick?: (timeKey: number) => void,
    onLongPressIn?: (timeKey: number) => void,
    onLongPressOut?: (timeKey: number) => void
}) => {

    let connectionWidth = Math.min(40, props.scaleX.bandwidth())

    console.log(props.scaleY.domain(), props.scaleY(props.scaleY.domain()[0]), props.scaleY(props.scaleY.domain()[1]))

    const feedbackArea = {
        x: props.scaleX(props.value.timeKey),
        y: 0,
        width: props.scaleX.bandwidth(),
        height: Math.abs(props.scaleY(props.scaleY.domain()[0]) - props.scaleY(props.scaleY.domain()[1]))
    }

    console.log(feedbackArea)

    return <TouchableGroup
        onClick={() => props.onClick && props.onClick(props.value.timeKey)}
        onLongPressIn={() => props.onLongPressIn && props.onLongPressIn(props.value.timeKey)}
        onLongPressOut={() => props.onLongPressOut && props.onLongPressOut(props.value.timeKey)}
        feedbackArea={feedbackArea}>

            <Rect fill="#BEBEBE50" rx={connectionWidth * 0.1}
                x={props.scaleX(props.value.timeKey) + (props.scaleX.bandwidth() - connectionWidth) * 0.5}
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