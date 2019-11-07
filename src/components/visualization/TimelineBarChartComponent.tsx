import React from 'react';
import { ChartComponentProps } from './ChartView';
import Svg, { G, Rect, } from 'react-native-svg';
import { scaleTime, scaleLinear } from 'd3-scale';
import * as d3Array from 'd3-array';
import { Rectangle, Padding } from './types';
import { AxisSvg, formatTimeTick } from './axis';
import { ChartColors } from './Style';
import { PanResponder, Animated, View, Text } from 'react-native';
import { startOfHour } from 'date-fns';
import Colors from '../../style/Colors';

const xAxisHeight = 50
const yAxisWidth = 64
const rightPadding = 18
const topPadding = 10

const yAxisTickSize = 10

const maxBarSpacing = 0.7

interface State {
    chartAreaResponder: any,
    chartAreaTouchPoint: { x: number, y: number },
    isChartAreaTouching: boolean
}

export class TimelineBarChartComponent extends React.PureComponent<ChartComponentProps, State>{


    constructor(props) {
        super(props)
        this.state = {
            chartAreaResponder: PanResponder.create({
                onStartShouldSetPanResponder: (ev, gestureState) => true,
                onMoveShouldSetPanResponder: (ev, gestureState) => true,
                onPanResponderMove: (ev, gestureState) => {
                    this.onTouchChartArea(ev.nativeEvent.locationX, ev.nativeEvent.locationY, true)
                },
                onPanResponderStart: (ev, gestureState) => {
                    this.onTouchChartArea(ev.nativeEvent.locationX, ev.nativeEvent.locationY, true)
                },
                onPanResponderEnd: (ev, gestureState) => {
                    this.onTouchChartArea(ev.nativeEvent.locationX, ev.nativeEvent.locationY, false)
                }
            }),
            chartAreaTouchPoint: { x: 0, y: 0 },
            isChartAreaTouching: false
        }
    }

    private transformViewXToChartAreaLocalX(x: number): number {
        return x - yAxisWidth
    }

    private transformViewYToChartAreaLocalY(y: number): number {
        return y - topPadding
    }

    private onTouchChartArea(x: number, y: number, touched: boolean) {
        const localX = this.transformViewXToChartAreaLocalX(x)
        const localY = this.transformViewYToChartAreaLocalY(y)
        this.setState({
            ...this.state,
            chartAreaTouchPoint: { x: localX, y: localY },
            isChartAreaTouching: touched
        })
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

        const unitWidth = scaleX(3600000) - scaleX(0)
        const barWidth = Math.max(1, unitWidth - 2 * maxBarSpacing)
        const barSpacing = (unitWidth - barWidth) / 2

        const scaleY = scaleLinear()
            .domain([0, d3Array.max(dataElements, (d) => d.value)]).nice()
            .range([chartArea.h, 0])

        const touchedDate: Date = startOfHour(scaleX.invert(this.state.chartAreaTouchPoint.x))
        const touchSnappedX = scaleX(touchedDate)

        const touchedPoint = dataElements.find(d => d.intrinsicDuration.start === touchedDate.getTime())


        return <View>
            <Svg width={this.props.containerWidth} height={this.props.containerHeight}>

                <AxisSvg key="xAxis" tickMargin={yAxisTickSize} ticks={scaleX.ticks()} chartArea={chartArea} scale={scaleX} position={Padding.Bottom} tickFormat={formatTimeTick} />
                <AxisSvg key="yAxis" tickMargin={yAxisTickSize} ticks={scaleY.ticks()} chartArea={chartArea} scale={scaleY} position={Padding.Left} />
                <G key="chart" {...chartArea}
                    {...this.state.chartAreaResponder.panHandlers}>

                    {this.state.isChartAreaTouching === true && touchSnappedX >= 0 && touchSnappedX + barWidth < chartArea.w ?
                        <Rect width={barWidth}
                            x={touchSnappedX}
                            height={chartArea.h}
                            fill="rgba(0,0,0,0.1)"
                        /> : <></>}

                    {
                        dataElements.map(d => {
                            const barHeight = scaleY(0) - scaleY(d.value)
                            return <Rect key={d.intrinsicDuration.start}
                                width={barWidth} height={barHeight}
                                x={scaleX(d.intrinsicDuration.start) + barSpacing}
                                y={scaleY(d.value)}
                                fill={ChartColors.elementDefaultColor}
                            />
                        })
                    }
                    <Rect x={-yAxisTickSize} width={chartArea.w + rightPadding} height={chartArea.h} fill="transparent" />
                </G>

            </Svg>
            {
                this.state.isChartAreaTouching === true ?
                    <Animated.View style={{
                        position: 'absolute',
                        top: '20%',
                        left: 0,
                        right: 0,
                        alignItems: 'center'
                    }}>
                        <View style={{
                            backgroundColor: Colors.accent,
                            padding: 8,
                            borderRadius: 10,

                        }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>{touchedPoint != null ? touchedPoint.value : 0}</Text>
                        </View>
                    </Animated.View> : <></>
            }

        </View>
    }
}