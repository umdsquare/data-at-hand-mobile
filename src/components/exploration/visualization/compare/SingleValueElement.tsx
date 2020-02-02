import React from 'react';
import { IAggregatedValue } from '../../../../core/exploration/data/types';
import { G, Rect, Line } from 'react-native-svg';
import { ScaleBand, ScaleLinear } from 'd3-scale';
import Colors from '../../../../style/Colors';

export const SingleValueElement = (props: {
    scaleY: ScaleLinear<number, number>,
    scaleX: ScaleBand<number>,
    value: IAggregatedValue,
    additionalPadding?: number,
    rangeColor?: string,
    maxWidth?: number
})=>{

    const bandPadding = props.additionalPadding || 0
    let x1 = props.scaleX(props.value.timeKey) + bandPadding * props.scaleX.bandwidth()
    let x2 = x1 + props.scaleX.bandwidth() - 2*bandPadding*props.scaleX.bandwidth()

    if(props.maxWidth && props.maxWidth < x2-x1){
        x1 = x1 + (x2-x1 - props.maxWidth)/2
        x2 = x1 + props.maxWidth
    }

    return <G>
        <Rect x={x1} y={props.scaleY(props.value.max)} 
            width={x2-x1} height={props.scaleY(props.value.min) - props.scaleY(props.value.max)}
            fill={props.rangeColor || Colors.chartRangeColor}
            />
        <Line x1={x1} x2={x2} y={props.scaleY(props.value.avg)} stroke={Colors.textColorDark} strokeWidth={2} strokeDasharray={"1.5"}/>
        <Line x1={x1} x2={x2} y={props.scaleY(props.value.max)} stroke={Colors.chartLightText}/>
        <Line x1={x1} x2={x2} y={props.scaleY(props.value.min)} stroke={Colors.chartLightText}/>
        
    </G>
}