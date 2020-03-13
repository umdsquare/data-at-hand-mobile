import React, { useState, useMemo } from 'react';
import { ChartProps } from '../types';
import Svg, { G, Rect, Line } from 'react-native-svg';
import { CommonBrowsingChartStyles } from './common';
import { AxisSvg } from '../../../visualization/axis';
import { Padding } from '../../../visualization/types';
import { DateTimeHelper } from '../../../../time';
import { DateBandAxis } from './DateBandAxis';
import { scaleLinear } from 'd3-scale';
import * as d3Array from 'd3-array';
import Colors from '../../../../style/Colors';
import { GroupWithTouchInteraction } from './GroupWithTouchInteraction';
import { useSelector } from 'react-redux';
import { ReduxAppState } from '../../../../state/types';
import { DataServiceManager } from '../../../../system/DataServiceManager';

interface Props extends ChartProps {
    valueTickFormat?: (num: number) => string,
    valueTicksOverride?: (maxValue: number) => {
        newDomain: number[],
        ticks: number[]}
}

export const DailyBarChart = React.memo((prop: Props) => {

    const shouldHighlightElements = useMemo(()=> prop.highlightFilter && prop.highlightFilter.dataSource === prop.dataSource && prop.highlightedDays, [
        prop.highlightFilter,
        prop.dataSource,
        prop.highlightedDays
    ])

    const serviceKey = useSelector((appState:ReduxAppState) => appState.settingsState.serviceKey)
    const getToday = DataServiceManager.instance.getServiceByKey(serviceKey).getToday

    const chartArea = CommonBrowsingChartStyles.makeChartArea(prop.containerWidth, prop.containerHeight)

    const scaleX = CommonBrowsingChartStyles
        .makeDateScale(undefined, prop.dateRange[0], prop.dateRange[1])
        .padding(0.2)
        .range([0, chartArea.width])


    const today = DateTimeHelper.toNumberedDateFromDate(getToday())
    const xTickFormat = CommonBrowsingChartStyles.dateTickFormat(today)

    const scaleY = scaleLinear()
        .domain([0, Math.max(d3Array.max(prop.data, d => d.value)!, prop.preferredValueRange[1] || Number.MIN_SAFE_INTEGER)])
        .range([chartArea.height, 0])
        .nice()

    const mean = prop.data.length > 0 ? d3Array.mean(prop.data, d => d.value) : null

    let ticks: number[]
    if(prop.valueTicksOverride){
        const tickInfo = prop.valueTicksOverride(scaleY.domain()[1])
        scaleY.domain(tickInfo.newDomain)
        ticks = tickInfo.ticks
    }
    else {
        ticks = scaleY.ticks(5)
    }

    return <Svg width={prop.containerWidth} height={prop.containerHeight}>
        <DateBandAxis key="xAxis" scale={scaleX} dateSequence={scaleX.domain()} today={today} tickFormat={xTickFormat} chartArea={chartArea} />
        <AxisSvg key="yAxis" tickMargin={0} ticks={ticks} tickFormat={prop.valueTickFormat} chartArea={chartArea} scale={scaleY} position={Padding.Left} />

        <GroupWithTouchInteraction chartArea={chartArea} scaleX={scaleX} dataSource={prop.dataSource} getValueOfDate={(date) => prop.data.find(d => d.numberedDate === date)!.value} highlightedDays={prop.highlightedDays}>
            {
                prop.data.map(d => {
                    const barHeight = scaleY(0) - scaleY(d.value)
                    const barWidth = Math.min(scaleX.bandwidth(), 25)
                    return <Rect key={d.numberedDate}
                        width={barWidth} height={barHeight}
                        x={scaleX(d.numberedDate)! + (scaleX.bandwidth() - barWidth) * 0.5}
                        y={scaleY(d.value)}

                        fill={today === d.numberedDate ? Colors.today : (shouldHighlightElements && prop.highlightedDays[d.numberedDate] != null ? Colors.highlightElementColor : Colors.chartElementDefault)}
                        opacity={0.62}
                    />
                })
            }
            {
                mean != null && <Line x1={0} x2={chartArea.width} y={scaleY(mean)} stroke={Colors.chartAvgLineColor} strokeWidth={1} strokeDasharray={"2"} />
            }
        </GroupWithTouchInteraction>
    </Svg>

})