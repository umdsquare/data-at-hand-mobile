import React from 'react';
import { IAggregatedValue, CyclicTimeFrame } from "../../../../core/exploration/data/types";
import { View, LayoutRectangle } from "react-native";
import { SizeWatcher } from "../../../visualization/SizeWatcher";
import { useState } from "react";
import { StyleTemplates } from "../../../../style/Styles";
import { scaleBand, scaleLinear } from "d3-scale";
import { min, max } from "d3-array";
import Svg, { G, Line, Text as SvgText } from "react-native-svg";
import Colors from "../../../../style/Colors";
import { Sizes } from '../../../../style/Sizes';
import { SingleValueElement } from './SingleValueElement';
import { SingleValueElementLegend } from './SingleValueElementLegend';

const dummyConverter = (num: number)=> num

const xAxisHeight = 100
const yAxisWidth = 60
const topPadding = 20
const rightPadding = 20

const dowNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const getDowName = (i: number) => dowNames[i]
const getMonthName = (i: number) => monthNames[i]

export const SingleValueCyclicChart = (props: {
    values: Array<IAggregatedValue>,
    cycleType: CyclicTimeFrame,
    yTickFormat?: (number) => string,
    startFromZero?: boolean,
    ticksOverride?: (min: number, max: number)=>number[],
    valueConverter?: (number)=>number
}) => {

    const convert = props.valueConverter || dummyConverter

    const [chartContainerWidth, setChartContainerWidth] = useState(-1)
    const [chartContainerHeight, setChartContainerHeight] = useState(-1)


    const chartArea: LayoutRectangle = {
        x: yAxisWidth,
        y: topPadding,
        width: chartContainerWidth - yAxisWidth - rightPadding,
        height: chartContainerHeight - xAxisHeight - topPadding
    }

    let domain: number[]
    let tickFormat: (number) => string
    switch (props.cycleType) {
        case CyclicTimeFrame.DayOfWeek:
            domain = [0, 1, 2, 3, 4, 5, 6]
            tickFormat = getDowName
            break;
        case CyclicTimeFrame.MonthOfYear:
            domain = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
            tickFormat = getMonthName
            break;
    }

    const scaleX = scaleBand<number>().domain(domain).range([0, chartArea.width]).padding(0.35)
    const scaleY = scaleLinear()
        .domain([props.startFromZero === true ? 0 : min(props.values, v => convert(v.min)), max(props.values, v => convert(v.max))])
        .range([chartArea.height, 0]).nice()

    return <View style={StyleTemplates.fillFlex}>
        <View style={{ alignItems: 'flex-end', padding: Sizes.horizontalPadding }}>

            <SingleValueElementLegend />
        </View>
        <SizeWatcher containerStyle={StyleTemplates.fillFlex} onSizeChange={(width, height) => {
            setChartContainerWidth(width)
            setChartContainerHeight(height)
        }}>
            <Svg width={chartContainerWidth} height={chartContainerHeight}>
                <G x={chartArea.x} y={chartArea.y + chartArea.height}>
                    <Line x1={0} x2={chartArea.width} y={0} stroke={Colors.textColorDark} strokeWidth={0.5} />
                    {
                        domain.map(dimension => <SvgText
                            key={dimension}
                            textAnchor={"middle"}
                            alignmentBaseline="hanging"
                            fontSize={Sizes.smallFontSize}
                            fill={Colors.textColorLight}
                            y={12}
                            x={scaleX(dimension) + scaleX.bandwidth() * .5}>{tickFormat(dimension)}</SvgText>)
                    }
                </G>
                <G x={chartArea.x} y={chartArea.y}>
                    {
                        (props.ticksOverride !=null? props.ticksOverride(scaleY.domain()[0], scaleY.domain()[1]) : scaleY.ticks()).map(tick => {
                            return <G key={tick} x={0} y={scaleY(tick)}>
                                <SvgText textAnchor="end" fill={Colors.chartElementDefault} alignmentBaseline="central" x={-8}>{props.yTickFormat ? props.yTickFormat(tick) : tick}</SvgText>
                                <Line x1={0} x2={chartArea.width} y={0} stroke={Colors.chartAxisLightColor} />
                            </G>
                        })
                    }
                </G>
                <G x={chartArea.x} y={chartArea.y}>
                    {
                        props.values.map(value => <SingleValueElement key={value.timeKey} value={{...value, avg: convert(value.avg), max: convert(value.max), min: convert(value.min), sum: convert(value.sum)}} scaleX={scaleX} scaleY={scaleY} />)
                    }
                </G>
            </Svg>
        </SizeWatcher>
    </View>
}