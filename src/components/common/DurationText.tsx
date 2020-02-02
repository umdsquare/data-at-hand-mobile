import React from 'react';
import { TextStyle, Text } from "react-native";

export const DurationText = (props: {durationMinutes: number, containerTextStyle?: TextStyle, unitStyle?: TextStyle, digitStyle?: TextStyle}) => {
        const hrs = Math.floor(props.durationMinutes / 60)
        const mins = props.durationMinutes % 60

        const schema = [{ type: "value", value: mins }, { type: 'unit', value: " min" }] as any
        if (hrs > 0) {
            schema.unshift({ type: 'unit', value: ' hr  ' })
            schema.unshift({ type: 'value', value: hrs })
        }

    return <Text style={{
        ...props.containerTextStyle,
    }}>
        {
            schema.map((entity, i) => <Text key={i.toString()}
                style={entity.type === 'unit' ? props.unitStyle : props.digitStyle}>{entity.value}</Text>)
        }
    </Text>
}