import React from 'react';
import { CircleProps, Circle, Line } from 'react-native-svg';


interface PointFallbackCircleProps extends CircleProps {
    thresholdRadius: number
  }
  
  export const PointFallbackCircle = (props: PointFallbackCircleProps)=>{
    if(props.r >= props.thresholdRadius){
      //circle
      return <Circle {...props} />
    }else {
      //point
      return <Line
        x={props.x}
        y1={props.y as number - 0.75}
        y2={props.y as number + 0.75}
        stroke={props.stroke}
        strokeWidth={1.5}
        opacity={props.opacity}
      />
    }
  }