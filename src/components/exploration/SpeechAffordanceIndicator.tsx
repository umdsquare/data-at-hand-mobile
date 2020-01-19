import { StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Colors from '../../style/Colors';
import React from "react";

const style =  {
        width: 6,
        height: 6,
        borderRadius: 3
    }

const start = {
    x: 0,
    y: 0,
}

const end = {
    x: 1, 
    y: 1
}

export const SpeechAffordanceIndicator = ()=>{
    return <LinearGradient style={style} colors={Colors.speechAffordanceGradient} start={start} end={end}  />
}