import React from 'react';
import { ChartProps } from '../types';
import Svg, { Rect, Line } from 'react-native-svg';
import { CommonBrowsingChartStyles } from './common';
import { AxisSvg } from '../../../visualization/axis';
import { Padding } from '../../../visualization/types';
import { DateTimeHelper } from '../../../../time';
import { DateBandAxis } from './DateBandAxis';
import { scaleLinear } from 'd3-scale';
import * as d3Array from 'd3-array';
import Colors from '../../../../style/Colors';
import { startOfDay, addSeconds, format } from 'date-fns';
import { GroupWithTouchInteraction } from './GroupWithTouchInteraction';

interface Props extends ChartProps{
    data: Array<{numberedDate: number, value: number, bedTimeDiffSeconds: number, wakeTimeDiffSeconds: number}>
}

const pivot = startOfDay(new Date())

const tickFormat = (tick:number) => {
    if(tick === 0){
        return "MN"
    }
    else return format(addSeconds(pivot, tick),"h a").toLowerCase()
}

export const DailySleepRangeChart = (prop: Props) => {

    const chartArea = CommonBrowsingChartStyles.makeChartArea(prop.containerWidth, prop.containerHeight)

    const scaleX = CommonBrowsingChartStyles
        .makeDateScale(null, prop.dateRange[0], prop.dateRange[1])
        .padding(0.2)
        .range([0, chartArea.width])


    const today = DateTimeHelper.toNumberedDateFromDate(new Date())
    const xTickFormat = CommonBrowsingChartStyles.dateTickFormat(today)

    const latestTimeDiff =  Math.max(d3Array.max(prop.data, d => d.wakeTimeDiffSeconds), d3Array.max(prop.data, d => d.bedTimeDiffSeconds))
    const earliestTimeDiff = Math.min(d3Array.min(prop.data, d => d.wakeTimeDiffSeconds), d3Array.min(prop.data, d => d.bedTimeDiffSeconds))

    const scaleForNice= scaleLinear()
    .domain([Math.floor(earliestTimeDiff/3600), Math.ceil(latestTimeDiff/3600)])
    .nice()
    
    const ticks = scaleForNice.ticks(5).map(t => t*3600)

    const niceDomain = scaleForNice.domain().map(d => d*3600)


    const scaleY = scaleLinear()
        .domain(niceDomain)
        .range([0, chartArea.height])

    const bedTimeAvg = d3Array.mean(prop.data, d => d.bedTimeDiffSeconds)
    const wakeTimeAvg = d3Array.mean(prop.data, d => d.wakeTimeDiffSeconds)

    return <Svg width={prop.containerWidth} height={prop.containerHeight}>
        <DateBandAxis key="xAxis" scale={scaleX} dateSequence={scaleX.domain()} today={today} tickFormat={xTickFormat} chartArea={chartArea} />
        <AxisSvg key="yAxis" tickMargin={0} ticks={ticks} tickFormat={tickFormat} chartArea={chartArea} scale={scaleY} position={Padding.Left} />
        <GroupWithTouchInteraction chartArea={chartArea} scaleX={scaleX} dataSource={prop.dataSource}>
            {
                prop.data.map(d => {
                    const barHeight = scaleY(d.wakeTimeDiffSeconds) - scaleY(d.bedTimeDiffSeconds)
                    const barWidth = Math.min(scaleX.bandwidth(), 20)
                    return <Rect key={d.numberedDate}
                                width={barWidth} height={barHeight}
                                x={scaleX(d.numberedDate) + (scaleX.bandwidth() - barWidth)*0.5 }
                                y={scaleY(d.bedTimeDiffSeconds)}
                                rx={2}
                                fill={today === d.numberedDate? Colors.today : Colors.chartElementDefault}
                                opacity={0.62}
                            />
                })
            }
            {
                Number.isNaN(bedTimeAvg) === false && <Line x1={0} x2={chartArea.width} y={scaleY(bedTimeAvg)} stroke={Colors.chartAvgLineColor} strokeWidth={1} strokeDasharray={"2"}/>
            }
            {
                Number.isNaN(wakeTimeAvg) === false && <Line x1={0} x2={chartArea.width} y={scaleY(wakeTimeAvg)} stroke={Colors.chartAvgLineColor} strokeWidth={1} strokeDasharray={"2"}/>
            }
        </GroupWithTouchInteraction>
    </Svg>

}