import React from 'react';
import { ChartProps } from '../types';
import Svg, { G, Rect, Circle, Line, Path } from 'react-native-svg';
import { CommonBrowsingChartStyles } from './CommonStyles';
import { AxisSvg } from '../../../visualization/axis';
import { Padding } from '../../../visualization/types';
import { DateTimeHelper } from '../../../../time';
import { DateBandAxis } from './DateBandAxis';
import { scaleLinear } from 'd3-scale';
import * as d3Array from 'd3-array';
import * as d3Shape from 'd3-shape';
import Colors from '../../../../style/Colors';


export const DailyHeartRateChart = (prop: ChartProps) => {

    const chartArea = CommonBrowsingChartStyles.makeChartArea(prop.containerWidth, prop.containerHeight)

    const scaleX = CommonBrowsingChartStyles
        .makeDateScale(null, prop.dateRange[0], prop.dateRange[1])
        .padding(0.2)
        .range([0, chartArea.w])


    const today = DateTimeHelper.toNumberedDateFromDate(new Date())
    const xTickFormat = CommonBrowsingChartStyles.dateTickFormat(today)


    const scaleY = scaleLinear()
        .domain([d3Array.min(prop.data, d => d.value) - 1, d3Array.max(prop.data, d => d.value) + 1])
        .range([chartArea.h, 0])
        .nice()

    const line = d3Shape.line<{value: number, numberedDate: number}>()
        .x((d) => scaleX(d.numberedDate) + scaleX.bandwidth() * 0.5)
        .y((d) => scaleY(d.value))
        .curve(d3Shape.curveCardinal)

    return <Svg width={prop.containerWidth} height={prop.containerHeight}>
        <DateBandAxis key="xAxis" scale={scaleX} dateSequence={scaleX.domain()} today={today} tickFormat={xTickFormat} chartArea={chartArea} />
        <AxisSvg key="yAxis" tickMargin={0} ticks={scaleY.ticks(5)} chartArea={chartArea} scale={scaleY} position={Padding.Left} />
        <G key="chart" {...chartArea}>
            {
                <Path d={line(prop.data)}
                    strokeWidth={2.5}
                    fill="transparent"
                    stroke={Colors.chartElementDefault}
                    opacity={0.3}
                />
            }
            {
                prop.data.map(d => {
                    return <Circle key={d.numberedDate}
                        x={scaleX(d.numberedDate) + scaleX.bandwidth() * 0.5}
                        y={scaleY(d.value)}
                        r={Math.min(scaleX.bandwidth(), 8)/2 }
                        strokeWidth={2}
                        fill='white'
                        stroke={today === d.numberedDate ? Colors.today : Colors.chartElementDefault}
                        opacity={0.62}
                    />
                })
            }
        </G>
    </Svg>

}