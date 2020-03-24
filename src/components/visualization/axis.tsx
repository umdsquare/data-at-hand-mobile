import React from 'react';
import { Padding } from './types';
import { G, Line, Circle, Text } from 'react-native-svg';
import Colors from '@style/Colors';
import { getHours, format } from 'date-fns';
import { LayoutRectangle } from 'react-native';

interface Props<T> {
    ticks: Array<T>
    tickMargin: number
    scale: (value: T) => number
    tickFormat?: (value: T) => string
    chartArea: LayoutRectangle
    position: Padding
    overrideTickLabelStyle?: any
}

export const AxisSvg = (props: Props<any>) => {
    switch (props.position) {
        case Padding.Bottom:
            return <G pointerEvents="none" x={props.chartArea.x} y={props.chartArea.y + props.chartArea.height}>
                <Line x1={-props.tickMargin} x2={props.chartArea.width + 8} y1={0} y2={0} stroke={Colors.textColorLight} strokeWidth={0.5} />

                {
                    props.ticks.map(tick => {
                        return <G key={tick instanceof Date? tick.toISOString() : tick} x={props.scale(tick)}>
                            <Circle fill="rgba(0,0,0,0.3)" r={2.5} cy={12} />
                            <Text {...props.overrideTickLabelStyle} textAnchor="end" y={12} transform="rotate(-45)translate(-16)"
                            fill={Colors.chartElementDefault}>{props.tickFormat? props.tickFormat(tick): tick}</Text>
                        </G>
                    })
                }
            </G>
        case Padding.Left:
            return <G pointerEvents="none" y={props.chartArea.y}>
            {
                props.ticks.map(tick => {
                    return <G key={tick} y={props.scale(tick)}>
                        <Line x1={props.chartArea.x - props.tickMargin} x2={props.chartArea.x + props.chartArea.width} stroke="rgba(0,0,0,0.07)" />
                        <Text {...props.overrideTickLabelStyle} alignmentBaseline="central" fontWeight={500} textAnchor="end" x={props.chartArea.x - props.tickMargin - 8} fill={Colors.chartElementDefault}>{props.tickFormat? props.tickFormat(tick): tick}</Text>
                    </G>

                })
            }
        </G>
        default: return <></>
    }

}

export function formatTimeTick(tick: Date): string {

    switch (getHours(tick)) {
        case 12: return "Noon"
        case 0:
        case 24:
            return format(tick, "MMM d")
        default:
            return format(tick, "hh a")
    }
}