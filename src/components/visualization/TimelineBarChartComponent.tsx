import React from 'react';
import { ChartComponentProps } from './ChartView';
import Svg, { G, Rect, Line, Text } from 'react-native-svg';
import { scaleTime, scaleLinear } from 'd3-scale';
import * as d3Array from 'd3-array';
import Colors from '../../style/Colors';
import { Rectangle, Padding } from './types';
import { AxisSvg, formatTimeTick } from './axis';
import { semanticToDuration, Presets } from '../../core/interaction/time';

const xAxisHeight = 50
const yAxisWidth = 64
const rightPadding = 18
const topPadding = 10

const yAxisTickSize = 10

const barSpacing = 1

interface Props extends ChartComponentProps {

}


export class TimelineBarChartComponent extends React.PureComponent<Props>{

    constructor(props) {
        super(props)
    }


    render() {
        const chartArea = {
            x: yAxisWidth,
            y: topPadding,
            w: this.props.containerWidth - yAxisWidth - rightPadding,
            h: this.props.containerHeight - xAxisHeight - topPadding
        } as Rectangle

        const { timeFrame, dataElements } = this.props.schema

        const scaleX = scaleTime().domain([new Date(timeFrame.start), new Date(timeFrame.end)]).nice()
            .range([0, chartArea.w])

        const barWidth = Math.max(1, scaleX(3600000) - scaleX(0))

        const scaleY = scaleLinear()
            .domain([0, d3Array.max(dataElements, (d) => d.value)]).nice()
            .range([chartArea.h, 0])

        return <Svg width={this.props.containerWidth} height={this.props.containerHeight}>

            <AxisSvg key="xAxis" tickMargin={yAxisTickSize} ticks={scaleX.ticks()} chartArea={chartArea} scale={scaleX} position={Padding.Bottom} tickFormat={formatTimeTick}/>
            <AxisSvg key="yAxis" tickMargin={yAxisTickSize} ticks={scaleY.ticks()} chartArea={chartArea} scale={scaleY} position={Padding.Left}/>
            <G key="chart" {...chartArea}>
                {
                    dataElements.map(d => {
                        const barHeight = scaleY(0) - scaleY(d.value)
                        return <Rect key={d.intrinsicDuration.start}
                            width={barWidth - 2 * barSpacing} height={barHeight}
                            x={scaleX(d.intrinsicDuration.start) + barSpacing}
                            y={scaleY(d.value)}
                            fill="#656565"
                        />
                    })
                }
            </G>

        </Svg>
    }
}