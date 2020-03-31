import React, { useCallback } from 'react';
import { IAggregatedValue } from "@core/exploration/data/types";
import { View, LayoutRectangle, ViewStyle } from "react-native";
import { SizeWatcher } from "@components/visualization/SizeWatcher";
import { useState } from "react";
import { StyleTemplates } from "@style/Styles";
import { scaleBand, scaleLinear } from "d3-scale";
import { min, max } from "d3-array";
import { G } from "react-native-svg";
import { Sizes } from '@style/Sizes';
import { SingleValueElement } from './SingleValueElement';
import { SingleValueElementLegend } from './SingleValueElementLegend';
import { getDomainAndTickFormat, makeTouchingInfoForCycle } from './common';
import { CycleChartFrame } from './CycleChartFrame';
import { useDispatch } from 'react-redux';
import { createGoToCyclicDetailDailyAction, InteractionType, createGoToCyclicDetailRangeAction, setTouchElementInfo } from '@state/exploration/interaction/actions';
import { CyclicTimeFrame, getCycleDimensionWithTimeKey, getCycleLevelOfDimension } from '@core/exploration/cyclic_time';
import { DataSourceType } from '@data-at-hand/core/measure/DataSourceSpec';

const dummyConverter = (num: number) => num

const xAxisHeight = 100
const yAxisWidth = 60
const topPadding = 20
const rightPadding = 20

const legendContainerStyle = { alignItems: 'flex-end', padding: Sizes.horizontalPadding } as ViewStyle

export const SingleValueCyclicChart = (props: {
    values: Array<IAggregatedValue>,
    dataSource: DataSourceType,
    cycleType: CyclicTimeFrame,
    yTickFormat?: (num: number) => string,
    startFromZero?: boolean,
    preferredValueRange?: number[],
    ticksOverride?: (min: number, max: number) => number[],
    valueConverter?: (num: number) => number
}) => {

    const convert = props.valueConverter || dummyConverter

    const [chartContainerWidth, setChartContainerWidth] = useState(-1)
    const [chartContainerHeight, setChartContainerHeight] = useState(-1)

    const dispatch = useDispatch()

    const chartArea: LayoutRectangle = {
        x: yAxisWidth,
        y: topPadding,
        width: chartContainerWidth - yAxisWidth - rightPadding,
        height: chartContainerHeight - xAxisHeight - topPadding
    }

    const { domain, tickFormat } = getDomainAndTickFormat(props.cycleType)

    const scaleX = scaleBand<number>().domain(domain).range([0, chartArea.width]).padding(0.35)
    const scaleY = scaleLinear()
        .domain([
            props.startFromZero === true ? 0 :
                Math.min(min(props.values, v => convert(v.min))!,
                    props.preferredValueRange ? convert(props.preferredValueRange[0]) : Number.MAX_VALUE),
            Math.max(max(props.values, v => convert(v.max))!,
                props.preferredValueRange ? convert(props.preferredValueRange[1]) : Number.MIN_VALUE)])
        .range([chartArea.height, 0]).nice()


    let ticks
    if (props.ticksOverride) {
        ticks = props.ticksOverride(scaleY.domain()[0], scaleY.domain()[1])
        scaleY.domain([ticks[0], ticks[ticks.length - 1]])
    }

    const onClickElement = useCallback((timeKey: number) => {
        const dimension = getCycleDimensionWithTimeKey(props.cycleType, timeKey)
        if (getCycleLevelOfDimension(dimension) === 'day') {
            dispatch(createGoToCyclicDetailDailyAction(InteractionType.TouchOnly, undefined, undefined, dimension))
        } else {
            dispatch(createGoToCyclicDetailRangeAction(InteractionType.TouchOnly, undefined, undefined, dimension))
        }
    }, [props.cycleType])

    const onLongPress = useCallback((timeKey, x, y, screenX, screenY, touchId) => {
        dispatch(setTouchElementInfo(makeTouchingInfoForCycle(timeKey,
            props.dataSource,
            props.cycleType,
            scaleX, chartArea, x, y, screenX, screenY, touchId, (timeKey) => {
                return props.values.find(v => v.timeKey === timeKey)
            })))
    }, [props.dataSource, props.cycleType, chartArea, scaleX, props.values])

    const onLongPressOut = useCallback(() => {
        dispatch(setTouchElementInfo(null))
    }, [])

    return <View style={StyleTemplates.fillFlex}>
        <View style={legendContainerStyle}>

            <SingleValueElementLegend />
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
                onClickElement={onClickElement}
                onLongPressIn={onLongPress}
                onLongPressMove={onLongPress}
                onLongPressOut={onLongPressOut}
            >
                <G x={chartArea.x} y={chartArea.y}>
                    {
                        props.values.map(value => <SingleValueElement key={value.timeKey}
                            value={{ ...value, avg: convert(value.avg), max: convert(value.max), min: convert(value.min), sum: convert(value.sum) }}
                            scaleX={scaleX} scaleY={scaleY} maxWidth={40}
                        />)
                    }
                </G>
            </CycleChartFrame>

        </SizeWatcher>
    </View>
}