import React from 'react';
import { CyclicTimeFrame, IAggregatedRangeValue } from "../../../../core/exploration/data/types";
import { View, LayoutRectangle } from "react-native";
import { SizeWatcher } from "../../../visualization/SizeWatcher";
import { useState } from "react";
import { StyleTemplates } from "../../../../style/Styles";
import { scaleBand, scaleLinear } from "d3-scale";
import { min, max } from "d3-array";
import { G } from "react-native-svg";
import { Sizes } from '../../../../style/Sizes';
import { SingleValueElementLegend } from './SingleValueElementLegend';
import { getDomainAndTickFormat } from './common';
import { CycleChartFrame } from './CycleChartFrame';
import { RangeValueElement } from './RangeValueElement';
import { RangeValueElementLegend } from './RangeValueElementLegend';

const dummyConverter = (num: number) => num

const xAxisHeight = 100
const yAxisWidth = 60
const topPadding = 20
const rightPadding = 20

export const RangeValueCyclicChart = (props: {
    values: Array<IAggregatedRangeValue>,
    cycleType: CyclicTimeFrame,
    yTickFormat?: (number) => string,
    startFromZero?: boolean,
    ticksOverride?: (min: number, max: number) => number[],
    rangeALabel: string,
    rangeBLabel: string
}) => {

    const [chartContainerWidth, setChartContainerWidth] = useState(-1)
    const [chartContainerHeight, setChartContainerHeight] = useState(-1)


    const chartArea: LayoutRectangle = {
        x: yAxisWidth,
        y: topPadding,
        width: chartContainerWidth - yAxisWidth - rightPadding,
        height: chartContainerHeight - xAxisHeight - topPadding
    }

    const { domain, tickFormat } = getDomainAndTickFormat(props.cycleType)

    const scaleX = scaleBand<number>().domain(domain).range([0, chartArea.width]).padding(0.35)
    let scaleY = scaleLinear()
        .domain([props.startFromZero === true ? 0 : Math.min(min(props.values, v => (v.minA)), min(props.values, v => (v.minB))), Math.max(max(props.values, v => (v.maxA)), max(props.values, v => (v.maxB)))])
        .range([0, chartArea.height]).nice()
    
    let ticks
    if (props.ticksOverride) {
        ticks = props.ticksOverride(scaleY.domain()[0], scaleY.domain()[1])
        scaleY = scaleY.domain([ticks[0], ticks[ticks.length - 1]])
    }

    return <View style={StyleTemplates.fillFlex}>
        <View style={{ alignItems: 'flex-end', padding: Sizes.horizontalPadding, paddingLeft: 0, paddingRight: 0 }}>
            <RangeValueElementLegend rangeALabel={props.rangeALabel} rangeBLabel={props.rangeBLabel}/>
        </View>
        <SizeWatcher containerStyle={StyleTemplates.fillFlex} onSizeChange={(width, height) => {
            setChartContainerWidth(width)
            setChartContainerHeight(height)
        }}>
            <CycleChartFrame
                {...props}
                chartArea={chartArea}
                chartContainerWidth={chartContainerWidth}
                chartContainerHeight={chartContainerHeight}
                cycleDomain={domain}
                xTickFormat={tickFormat}
                scaleX={scaleX}
                scaleY={scaleY}
                ticks={ticks}
            >
                <G x={chartArea.x} y={chartArea.y}>
                    {
                        props.values.map(value => <RangeValueElement key={value.timeKey} scaleX={scaleX} scaleY={scaleY} value={value} />)
                    }
                </G>
            </CycleChartFrame>

        </SizeWatcher>
    </View>
}