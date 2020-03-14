import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import { WheelPicker } from 'react-native-wheel-picker-android'
import { getNumberSequence } from '../../utils'
import pluralize from 'pluralize'

const hours = getNumberSequence(0, 24).map(n => pluralize("hour", n, true))
const minutes = getNumberSequence(0, 11).map(n => pluralize("minute", n * 5, true))

const styles = StyleSheet.create({
    containerStyle: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    pickerStyle: {
        height: Platform.OS === 'ios' ? undefined : 150,
        width: 150,
        flex: 1,
    }
})

const pickerProps = {
    selectedItemTextFontFamily: undefined,
    itemTextFontFamily: undefined,
    style: styles.pickerStyle
}

export const DurationWheelPicker = (props: { 
    durationSeconds: number 
    onDurationChange: (duration: number) => void
}) => {

    const [ currentDuration, setCurrentDuration ] = useState(0)

    useEffect(() => {
        setCurrentDuration(props.durationSeconds)
    }, [props.durationSeconds])

    const {hour, minute} = useMemo(()=>{
        const hour = Math.floor(props.durationSeconds/3600)
        const minute = Math.floor((props.durationSeconds%3600)/60)
        return {
            hour, minute
        }
    }, [currentDuration])

    const onHourChange = useCallback((index) => {
        const duration = index * 3600 + minute * 60
        setCurrentDuration(duration)
        props.onDurationChange(duration)
    }, [minute, props.onDurationChange])

    const onMinuteChange = useCallback((index) => {
        const duration = hour * 3600 + (index) * 300
        setCurrentDuration(duration)
        props.onDurationChange(duration)
    }, [hour, props.onDurationChange])

    return <View style={styles.containerStyle}>
        <WheelPicker {...pickerProps} data={hours} initPosition={hour} selectedItem={hour} onItemSelected={onHourChange}/>
        <WheelPicker {...pickerProps} data={minutes} initPosition={Math.floor(minute/5)} selectedItem={Math.floor(minute/5)} onItemSelected={onMinuteChange}/>
    </View>
}