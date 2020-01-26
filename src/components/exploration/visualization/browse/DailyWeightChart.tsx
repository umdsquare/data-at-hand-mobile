import React from 'react';
import Svg, { G, Circle, Path, Line } from 'react-native-svg';
import { CommonBrowsingChartStyles } from './CommonStyles';
import { AxisSvg } from '../../../visualization/axis';
import { Padding } from '../../../visualization/types';
import { DateTimeHelper } from '../../../../time';
import { DateBandAxis } from './DateBandAxis';
import { scaleLinear } from 'd3-scale';
import * as d3Array from 'd3-array';
import * as d3Shape from 'd3-shape';
import Colors from '../../../../style/Colors';
import { IIntraDayLogEntry } from '../../../../core/exploration/data/types';
import { IWeightIntraDayLogEntry } from '../../../../measure/service/fitbit/realm/schema';


export const DailyWeightChart = (prop: {
    dateRange: number[],
    data: {
        trend: Array<{ numberedDate: number, value: number }>,
        logs: Array<IWeightIntraDayLogEntry>
    },
    futureNearestLog: IWeightIntraDayLogEntry,
    pastNearestLog: IWeightIntraDayLogEntry,
    containerWidth: number,
    containerHeight: number
}) => {

    const chartArea = CommonBrowsingChartStyles.makeChartArea(prop.containerWidth, prop.containerHeight)

    const scaleX = CommonBrowsingChartStyles
        .makeDateScale(null, prop.dateRange[0], prop.dateRange[1])
        .padding(0.2)
        .range([0, chartArea.w])


    const today = DateTimeHelper.toNumberedDateFromDate(new Date())
    const xTickFormat = CommonBrowsingChartStyles.dateTickFormat(today)

    const trendMin = prop.data.trend.length > 0 ? d3Array.min(prop.data.trend, d => d.value) : null
    const trendMax = prop.data.trend.length > 0 ? d3Array.max(prop.data.trend, d => d.value) : null

    const logMin = prop.data.logs.length > 0 ? d3Array.min(prop.data.logs, d => d.value) : null
    const logMax = prop.data.logs.length > 0 ? d3Array.max(prop.data.logs, d => d.value) : null

    const scaleY = scaleLinear()
        .domain([
            (trendMin != null || logMin != null ? (Math.min(trendMin || logMin, logMin || trendMin) - 1) : 0),
            (trendMax != null || logMax != null ? (Math.max(trendMax || logMax, logMax || trendMax) + 1) : 0),
        ])
        .range([chartArea.h, 0])
        .nice()

    const trendLine = d3Shape.line<{ value: number, numberedDate: number }>()
        .x((d) => scaleX(d.numberedDate) + scaleX.bandwidth() * 0.5)
        .y((d) => scaleY(d.value))


    const veryLastLog = prop.futureNearestLog == null ? (prop.data.logs.length > 0 ? prop.data.logs[prop.data.logs.length - 1] : prop.pastNearestLog) : null

    return <Svg width={prop.containerWidth} height={prop.containerHeight}>
        <DateBandAxis key="xAxis" scale={scaleX} dateSequence={scaleX.domain()} today={today} tickFormat={xTickFormat} chartArea={chartArea} />
        <AxisSvg key="yAxis" tickMargin={0} ticks={scaleY.ticks(5)} chartArea={chartArea} scale={scaleY} position={Padding.Left} />
        <G key="chart" {...chartArea}>
            {
                prop.data.logs.map(d => {
                    return <Circle key={d.numberedDate}
                        x={scaleX(d.numberedDate) + scaleX.bandwidth() * 0.5}
                        y={scaleY(d.value)}
                        r={Math.min(scaleX.bandwidth(), 8) / 2}
                        strokeWidth={2}
                        fill='white'
                        stroke={today === d.numberedDate ? Colors.today : Colors.chartElementDefault}
                        opacity={0.62}
                    />
                })
            }
            {
                <Path d={trendLine(prop.data.trend)}
                    strokeWidth={2.5}
                    fill="transparent"
                    stroke={Colors.chartElementDefault}
                    opacity={1}
                />
            }
            {
                veryLastLog && <Line 
                    x1={scaleX(Math.max(veryLastLog.numberedDate, scaleX.domain()[0]))} 
                    x2={chartArea.w}
                    y1={scaleY(veryLastLog.value)}
                    y2={scaleY(veryLastLog.value)}
                    stroke={Colors.today}
                    strokeWidth={2}
                    />
            }
        </G>
    </Svg>

}