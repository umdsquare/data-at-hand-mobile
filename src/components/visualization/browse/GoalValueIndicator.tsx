import React, { useMemo } from 'react';
import { G, Line, Text as SvgText, Path } from 'react-native-svg';
import { ScaleLinear } from 'd3-scale';
import Colors from '@style/Colors';
import { minimumVerticalAxisTickMargin } from '../axis';
import { Sizes } from '@style/Sizes';

//"M0-0.6L-2.9-4c-0.7-0.8-2.2-1.5-3.3-1.5h-19c-1.1,0-2,0.9-2,2v7c0,1.1,0.9,2,2,2h19.5c1.1,0,2.5-0.7,3.2-1.6L0,0.7"

function makeLabelPathData(tickSpacing: number, goalLineThickness: number, goalTextSize: number, goalTextPadding: number, labelAreaWidth: number): string {
    const horizontalStart = -tickSpacing + goalTextPadding
    const halfHeight = goalTextSize * .5 + goalTextPadding

    const cornerRadius = 0.5 * halfHeight

    return `
    M 2,${-goalLineThickness * .5}
    L ${horizontalStart},${halfHeight}
    l ${(-labelAreaWidth +12) + cornerRadius},0
    a ${cornerRadius},${cornerRadius} 0 0 1 ${-cornerRadius},${-cornerRadius}
    l 0,${-(halfHeight - cornerRadius)*2}
    a ${cornerRadius},${cornerRadius} 0 0 1 ${cornerRadius},${-cornerRadius}
    L ${horizontalStart},${-halfHeight}
    L 2,${goalLineThickness * .5}
    `
}

const lineThickness = 1.5

export const GoalValueIndicator = (props: {
    goal?: number,
    lineLength: number,
    labelAreaWidth: number,
    yScale: ScaleLinear<number, number>,
    valueConverter?: (value: number) => number,
    valueFormatter?: (value: number) => string
}) => {

    const y = useMemo(() => props.yScale(props.valueConverter != null ? props.valueConverter(props.goal) : props.goal), [props.goal, props.yScale, props.valueConverter])

    const label = useMemo(() => {
        if (props.goal == null) return null

        let value
        if (props.valueConverter != null) {
            value = props.valueConverter(props.goal)
        }
        else value = props.goal

        if (props.valueFormatter != null) {
            return props.valueFormatter(value)
        } else return value

    }, [props.valueConverter, props.valueFormatter, props.goal])

    return props.goal != null ? <G y={y}>
        <Line x1={0} x2={props.lineLength} stroke={Colors.chartGoalValueColor} strokeWidth={lineThickness} />
        <Path d={makeLabelPathData(minimumVerticalAxisTickMargin, lineThickness, Sizes.tinyFontSize, 2, props.labelAreaWidth)} fill={Colors.chartGoalValueColor} />

        <SvgText alignmentBaseline="central" fontWeight={500} textAnchor="end"
            x={- minimumVerticalAxisTickMargin} fill={Colors.WHITE}
        >{label}</SvgText>
    </G> : null
}