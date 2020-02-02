import React from 'react';
import { IAggregatedValue } from '../../../../core/exploration/data/types';
import { G, Rect, Line } from 'react-native-svg';
import { ScaleBand, ScaleLinear } from 'd3-scale';
import Colors from '../../../../style/Colors';

export const SingleValueElement = (props: {
    scaleY: ScaleLinear<number, number>,
    scaleX: ScaleBand<number>,
    value: IAggregatedValue   
})=>{
    console.log(props.value.min,props.value.max)

    const x1 = props.scaleX(props.value.timeKey)
    const x2 = x1 + props.scaleX.bandwidth()

    return <G>
        <Rect x={x1} y={props.scaleY(props.value.max)} 
            width={props.scaleX.bandwidth()} height={props.scaleY(props.value.min) - props.scaleY(props.value.max)}
            fill={Colors.chartRangeColor}
            />
        <Line x1={x1} x2={x2} y={props.scaleY(props.value.avg)} stroke={Colors.textColorDark} strokeWidth={2} strokeDasharray={"1.5"}/>
        <Line x1={x1} x2={x2} y={props.scaleY(props.value.max)} stroke={Colors.chartLightText}/>
        <Line x1={x1} x2={x2} y={props.scaleY(props.value.min)} stroke={Colors.chartLightText}/>
        
    </G>
}