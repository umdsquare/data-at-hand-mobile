import React from 'react';
import { ChartProps } from '../types';
import Svg, {G, Rect, Line} from 'react-native-svg';
import { CommonBrowsingChartStyles } from './CommonStyles';
import { AxisSvg } from '../../../visualization/axis';
import { Padding } from '../../../visualization/types';
import { DateTimeHelper } from '../../../../time';
import { DateBandAxis } from './DateBandAxis';
import { scaleLinear } from 'd3-scale';
import * as d3Array from 'd3-array';
import Colors from '../../../../style/Colors';

interface Props extends ChartProps{
    valueRange?: number[],
    valueTickFormat?: (number)=>string,
    valueTicksOverride?:(maxValue: number) => number[]
}

export const DailyBarChart = (prop: Props) => {

    const chartArea = CommonBrowsingChartStyles.makeChartArea(prop.containerWidth, prop.containerHeight)

    const scaleX = CommonBrowsingChartStyles
        .makeDateScale(null, prop.dateRange[0], prop.dateRange[1])
        .padding(0.2)
        .range([0, chartArea.w])


    const today = DateTimeHelper.toNumberedDateFromDate(new Date())
    const xTickFormat = CommonBrowsingChartStyles.dateTickFormat(today)


    const scaleY = scaleLinear()
        .domain([0, d3Array.max(prop.data, d=>d.value)])
        .range([chartArea.h, 0])
        .nice()

    const mean = prop.data.length > 0 ? d3Array.mean(prop.data, d => d.value) : null

    return <Svg width={prop.containerWidth} height={prop.containerHeight}>
        <DateBandAxis key="xAxis" scale={scaleX} dateSequence={scaleX.domain()} today={today} tickFormat={xTickFormat} chartArea={chartArea} />
        <AxisSvg key="yAxis" tickMargin={0} ticks={prop.valueTicksOverride != null ? prop.valueTicksOverride(scaleY.domain()[1]) : scaleY.ticks(5)} tickFormat={prop.valueTickFormat} chartArea={chartArea} scale={scaleY} position={Padding.Left} />
        <G key="chart" {...chartArea}>
            {
                prop.data.map(d => {
                    const barHeight = scaleY(0) - scaleY(d.value)
                    const barWidth = Math.min(scaleX.bandwidth(), 25)
                    return <Rect key={d.numberedDate}
                                width={barWidth} height={barHeight}
                                x={scaleX(d.numberedDate) + (scaleX.bandwidth() - barWidth)*0.5 }
                                y={scaleY(d.value)}

                                fill={today === d.numberedDate? Colors.today : Colors.chartElementDefault}
                                opacity={0.62}
                            />
                })
            }
            {
                mean != null && <Line x1={0} x2={chartArea.w} y={scaleY(mean)} stroke={Colors.chartAvgLineColor} strokeWidth={1} strokeDasharray={"2"}/>
            }
        </G>
    </Svg>

}