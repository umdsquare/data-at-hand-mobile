import React from 'react';
import { ChartComponentProps } from './ChartView';
import Svg, { G, Rect, Line, Text, Circle } from 'react-native-svg';
import { scaleTime, scaleLinear } from 'd3-scale';
import * as d3Array from 'd3-array';
import Colors from '../../style/Colors';
import { format } from 'date-fns-tz';
import { getHours } from 'date-fns';

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

    private formatTimeTick(tick: Date): string {

        switch (getHours(tick)) {
            case 12: return "Noon"
            case 0:
            case 24:
                return format(tick, "MMM d")
            default:
                return format(tick, "hh a")
        }
    }


    render() {
        const chartArea = {
            x: yAxisWidth,
            y: topPadding,
            w: this.props.containerWidth - yAxisWidth - rightPadding,
            h: this.props.containerHeight - xAxisHeight - topPadding
        }

        const { timeFrame, dataElements } = this.props.schema

        const scaleX = scaleTime().domain([new Date(timeFrame.start), new Date(timeFrame.end)]).nice()
            .range([0, chartArea.w])

        const barWidth = scaleX(3600000) - scaleX(0)

        const scaleY = scaleLinear()
            .domain([0, d3Array.max(dataElements, (d) => d.value)]).nice()
            .range([chartArea.h, 0])

        return <Svg width={this.props.containerWidth} height={this.props.containerHeight}>

            <G key="xAxis" x={chartArea.x} y={chartArea.y + chartArea.h}>
                <Line x1={-yAxisTickSize} x2={chartArea.w} y1={0} y2={0} stroke={Colors.textColorLight} strokeWidth={0.5} />

                {
                    scaleX.ticks().map(tick => {
                        return <G key={tick.getTime()} x={scaleX(tick)}>
                            <Circle fill="rgba(0,0,0,0.3)" r={2.5} cy={12} />
                            <Text textAnchor="end" y={12} transform="rotate(-45)translate(-16)" fill={Colors.textColorLight}>{this.formatTimeTick(tick)}</Text>
                        </G>
                    })
                }
            </G>

            <G key="yAxis" y={chartArea.y}>
                {
                    scaleY.ticks().map(tick => {
                        return <G key={tick} y={scaleY(tick)}>
                            <Line x1={chartArea.x - yAxisTickSize} x2={chartArea.x + chartArea.w} stroke="rgba(0,0,0,0.07)" />
                            <Text alignmentBaseline="central" fontWeight={500} textAnchor="end" x={chartArea.x - yAxisTickSize - 8} fill={Colors.textColorLight}>{tick}</Text>
                        </G>

                    })
                }
            </G>
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