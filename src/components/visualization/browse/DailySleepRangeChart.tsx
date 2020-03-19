import React from 'react';
import Svg, { Rect, Line, G } from 'react-native-svg';
import { CommonBrowsingChartStyles, ChartProps, getChartElementColor, getChartElementOpacity } from './common';
import { AxisSvg } from '@components/visualization/axis';
import { Padding } from '@components/visualization/types';
import { DateTimeHelper } from '@utils/time';
import { DateBandAxis } from './DateBandAxis';
import { scaleLinear } from 'd3-scale';
import * as d3Array from 'd3-array';
import Colors from '@style/Colors';
import { startOfDay, addSeconds, format } from 'date-fns';
import { useSelector } from 'react-redux';
import { ReduxAppState } from '@state/types';
import { DataServiceManager } from '@measure/DataServiceManager';
import { BandScaleChartTouchHandler } from './BandScaleChartTouchHandler';

interface Props extends ChartProps {
    data: Array<{ numberedDate: number, value: number, bedTimeDiffSeconds: number, wakeTimeDiffSeconds: number }>
}

const pivot = startOfDay(new Date())

const tickFormat = (tick: number) => {
    if (tick === 0) {
        return "MN"
    }
    else return format(addSeconds(pivot, tick), "h a").toLowerCase()
}

export const DailySleepRangeChart = React.memo((prop: Props) => {


    const { shouldHighlightElements, highlightReference } = CommonBrowsingChartStyles.makeHighlightInformation(prop, prop.dataSource)

    const serviceKey = useSelector((appState: ReduxAppState) => appState.settingsState.serviceKey)
    const getToday = DataServiceManager.instance.getServiceByKey(serviceKey).getToday

    const chartArea = CommonBrowsingChartStyles.makeChartArea(prop.containerWidth, prop.containerHeight)

    const scaleX = CommonBrowsingChartStyles
        .makeDateScale(undefined, prop.dateRange[0], prop.dateRange[1])
        .padding(0.2)
        .range([0, chartArea.width])


    const today = DateTimeHelper.toNumberedDateFromDate(getToday())
    const xTickFormat = CommonBrowsingChartStyles.dateTickFormat(today)

    const latestTimeDiff = Math.max(d3Array.max(prop.data, d => d.wakeTimeDiffSeconds)!, d3Array.max(prop.data, d => d.bedTimeDiffSeconds)!, prop.preferredValueRange[1] || Number.MIN_SAFE_INTEGER)
    const earliestTimeDiff = Math.min(d3Array.min(prop.data, d => d.wakeTimeDiffSeconds)!, d3Array.min(prop.data, d => d.bedTimeDiffSeconds)!, prop.preferredValueRange[0] || Number.MAX_SAFE_INTEGER)

    const scaleForNice = scaleLinear()
        .domain([Math.floor(earliestTimeDiff / 3600), Math.ceil(latestTimeDiff / 3600)])
        .nice()

    const ticks = scaleForNice.ticks(5).map(t => t * 3600)

    const niceDomain = scaleForNice.domain().map(d => d * 3600)

    const scaleY = scaleLinear()
        .domain(niceDomain)
        .range([0, chartArea.height])

    const bedTimeAvg = d3Array.mean(prop.data, d => d.bedTimeDiffSeconds)!
    const wakeTimeAvg = d3Array.mean(prop.data, d => d.wakeTimeDiffSeconds)!

    return <BandScaleChartTouchHandler
        chartContainerWidth={prop.containerWidth}
        chartContainerHeight={prop.containerHeight}
        chartArea={chartArea}
        scaleX={scaleX}
        dataSource={prop.dataSource}
        getValueOfDate={(date) => {
            const datum = prop.data ? prop.data.find(d => d.numberedDate === date) : null;
            if (datum) {
                return { value: datum.bedTimeDiffSeconds, value2: datum.wakeTimeDiffSeconds }
            } else return null
        }}
        highlightedDays={prop.highlightFilter != null ? prop.highlightedDays : undefined}>
        <DateBandAxis key="xAxis" scale={scaleX} dateSequence={scaleX.domain()} today={today} tickFormat={xTickFormat} chartArea={chartArea} />
        <AxisSvg key="yAxis" tickMargin={0} ticks={ticks} tickFormat={tickFormat} chartArea={chartArea} scale={scaleY} position={Padding.Left} />
        <G pointerEvents="none" {...chartArea}>
            {
                prop.data.map(d => {
                    const barHeight = scaleY(d.wakeTimeDiffSeconds) - scaleY(d.bedTimeDiffSeconds)
                    const barWidth = Math.min(scaleX.bandwidth(), 20)
                    return <Rect key={d.numberedDate}
                        width={barWidth} height={barHeight}
                        x={scaleX(d.numberedDate)! + (scaleX.bandwidth() - barWidth) * 0.5}
                        y={scaleY(d.bedTimeDiffSeconds)}
                        rx={2}
                        fill={getChartElementColor(shouldHighlightElements, prop.highlightedDays ? prop.highlightedDays[d.numberedDate] == true : false, today === d.numberedDate)}
                        opacity={getChartElementOpacity(today === d.numberedDate)}
                    />
                })
            }
            {
                Number.isNaN(bedTimeAvg) === false && <Line x1={0} x2={chartArea.width} y={scaleY(bedTimeAvg)} stroke={Colors.chartAvgLineColor} strokeWidth={CommonBrowsingChartStyles.AVERAGE_LINE_WIDTH} strokeDasharray={"2"} />
            }
            {
                Number.isNaN(wakeTimeAvg) === false && <Line x1={0} x2={chartArea.width} y={scaleY(wakeTimeAvg)} stroke={Colors.chartAvgLineColor} strokeWidth={CommonBrowsingChartStyles.AVERAGE_LINE_WIDTH} strokeDasharray={"2"} />
            }
            {
                highlightReference != null ? <Line x1={0} x2={chartArea.width} y={scaleY(highlightReference)} stroke={Colors.highlightElementColor} strokeWidth={2} /> : null
            }
        </G>
    </BandScaleChartTouchHandler>

})