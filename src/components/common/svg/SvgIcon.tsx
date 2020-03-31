import React from 'react';
import Svg, { Path, Circle } from "react-native-svg"
import { ViewStyle } from 'react-native';

export enum SvgIconType {
    ArrowRight,
    ArrowLeft,
    ArrowForward,
    Settings,
    Reset,
    Microphone,
    Check,
    QuestionMark
}

export const SvgIcon = (props: {
    color?: string,
    size?: number,
    style?: ViewStyle,
    type: SvgIconType
}) => {

    let content

    switch (props.type) {
        case SvgIconType.ArrowRight: content = <Path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill={props.color} />
            break;
        case SvgIconType.ArrowLeft: content = <Path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" fill={props.color} />
            break;
        case SvgIconType.ArrowForward: content = <Path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" fill={props.color} />
            break;
        case SvgIconType.Settings: content = <Path fill={props.color} d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
            break;
        case SvgIconType.Reset: content = <Path fill={props.color} d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            break;
        case SvgIconType.Microphone: content = <Path fill={props.color} d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
            break;
        case SvgIconType.QuestionMark:
            content = <>
                <Path fill={props.color} d="M13.4,17.7h-3v-2.8c0-3.1,1.8-4.3,3-5.1c1-0.7,1.5-1,1.5-2.3c0-2.2-0.7-2.9-2.9-2.9c-2.7,0-3,0.9-3,3H6c0-2.6,0.6-6,6-6
	c2.7,0,5.9,1,5.9,5.9c0,3-1.7,4.1-2.9,4.9c-1.1,0.7-1.6,1-1.6,2.5V17.7z" />
                <Circle fill={props.color} cx="11.9" cy="21.1" r="1.9" />
            </>
            break;
        case SvgIconType.Check:
            content = <Path fill={props.color} d="M9.1,14.8l-3.5-3.5l-2.1,2.1L9,19L21,7l-2.1-2.1L9.1,14.8z" />
            break;
    }


    return <Svg style={props.style} height={props.size || 24} width={props.size || 24} viewBox="0 0 24 24">
        {content}
    </Svg>
}