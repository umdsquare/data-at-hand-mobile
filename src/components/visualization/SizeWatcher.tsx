import React, { useState } from "react"
import { View, ViewStyle } from "react-native"

export const SizeWatcher = (prop: { containerStyle?: ViewStyle, children?: any, onSizeChange: (width:number, height:number)=>void}) => {
    const [width, setWidth] = useState(-1)
    const [height, setHeight] = useState(-1)

    return <View style={prop.containerStyle} onLayout={(layoutChangeEvent)=>{
        const { layout } = layoutChangeEvent.nativeEvent
        if (width != layout.width || height != layout.height) {
            setWidth(layout.width)
            setHeight(layout.height)
            prop.onSizeChange(layout.width, layout.height)
        }
    }}>{prop.children}</View>
}