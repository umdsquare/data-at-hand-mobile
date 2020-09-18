import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { DataDrivenQuery, NumericConditionType } from '@data-at-hand/core/exploration/ExplorationInfo'
import { View, StyleSheet, Text, Animated, Platform, ActionSheetIOS, UIManager, findNodeHandle } from 'react-native'
import Colors from '@style/Colors'
import { DataSourceManager } from '@measure/DataSourceManager'
import { StyleTemplates } from '@style/Styles'
import { Sizes } from '@style/Sizes'
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { RectButton } from 'react-native-gesture-handler'
import { DataSourceType, MeasureUnitType } from '@data-at-hand/core/measure/DataSourceSpec'
import pluralize from 'pluralize';
import deepEqual from 'deep-equal';
import Dialog from 'react-native-dialog'
import { DateTimeHelper } from '@data-at-hand/core/utils/time'
import { startOfDay, addSeconds, format, getHours, getMinutes } from 'date-fns'
import commaNumber from 'comma-number'
import DateTimePicker from '@react-native-community/datetimepicker';
import { TimePicker, WheelPicker } from "react-native-wheel-picker-android";
import { DurationWheelPicker } from '@components/common/DurationWheelPicker'
import { BEDTIME_SHIFT_HOUR_OF_DAY } from '@measure/consts'
import { useSelector } from 'react-redux'
import { ReduxAppState } from '@state/types'
import { getNumberSequence, clamp } from '@data-at-hand/core/utils'
import { Button } from 'react-native-elements'

const HEART_RATE_RANGE = getNumberSequence(0, 150)
const HEART_RATE_RANGE_TEXTS = HEART_RATE_RANGE.map(v => `${v.toString()} bpm`)

const WEIGHT_RANGE = getNumberSequence(0, 250)
const WEIGHT_RANGE_TEXTS_KG = WEIGHT_RANGE.map(v => `${v.toString()} kg`)
const WEIGHT_RANGE_TEXTS_LB = WEIGHT_RANGE.map(v => `${v.toString()} lb`)




type SpecType = { dataSourceType: DataSourceType, propertyKey?: string | null, label: string, presets?: number[] | ((unit: MeasureUnitType) => number[]) }
const dataSourceSpecs: Array<SpecType> = [
    { dataSourceType: DataSourceType.StepCount, propertyKey: undefined, label: DataSourceManager.instance.getSpec(DataSourceType.StepCount).name, presets: [5000, 10000, 20000] },
    { dataSourceType: DataSourceType.HeartRate, propertyKey: undefined, label: "Resting HR", presets: [60, 80, 100] },
    { dataSourceType: DataSourceType.HoursSlept, propertyKey: undefined, label: DataSourceManager.instance.getSpec(DataSourceType.HoursSlept).name, presets: [4 * 3600, 6 * 3600, 8 * 3600, 10 * 3600] },
    { dataSourceType: DataSourceType.SleepRange, propertyKey: "waketime", label: "Wake Time", presets: [7 * 3600, 9 * 3600, 10 * 3600] },
    { dataSourceType: DataSourceType.SleepRange, propertyKey: "bedtime", label: "Bedtime", presets: [-2 * 3600, 0, 1 * 3600] },
    { dataSourceType: DataSourceType.Weight, propertyKey: undefined, label: DataSourceManager.instance.getSpec(DataSourceType.Weight).name },
]

function getComparisonLabel(type: NumericConditionType, dataSource: DataSourceType): string {
    switch (dataSource) {
        case DataSourceType.StepCount:
            switch (type) {
                case NumericConditionType.Less: return "less than"
                case NumericConditionType.More: return "more than"
                case NumericConditionType.Min: return "minimum"
                case NumericConditionType.Max: return "maximum"
            }
            break;
        case DataSourceType.HeartRate:
            switch (type) {
                case NumericConditionType.Less: return "slower than"
                case NumericConditionType.More: return "faster than"
                case NumericConditionType.Min: return "minimum"
                case NumericConditionType.Max: return "maximum"
            }
            break;
        case DataSourceType.SleepRange:
            switch (type) {
                case NumericConditionType.Less: return "earlier than"
                case NumericConditionType.More: return "later than"
                case NumericConditionType.Min: return "earliest"
                case NumericConditionType.Max: return "latest"
            }
            break;
        case DataSourceType.HoursSlept:
            switch (type) {
                case NumericConditionType.Less: return "shorter than"
                case NumericConditionType.More: return "longer than"
                case NumericConditionType.Min: return "shortest"
                case NumericConditionType.Max: return "longest"
            }
            break;
        case DataSourceType.Weight:
            switch (type) {
                case NumericConditionType.Less: return "ligher than"
                case NumericConditionType.More: return "heavier than"
                case NumericConditionType.Min: return "minimum"
                case NumericConditionType.Max: return "maximum"
            }
            break;

    }
}

function getDefaultReference(dataSource: DataSourceType, propertyKey: string | undefined): number {
    switch (dataSource) {
        case DataSourceType.StepCount: return 10000
        case DataSourceType.HeartRate: return 80
        case DataSourceType.SleepRange:
            switch (propertyKey) {
                case 'waketime': return 8 * 3600
                case 'bedtime': return 0
            }
        case DataSourceType.HoursSlept: return 6 * 3600
        case DataSourceType.Weight: return 70
            break;

    }
}

const styles = StyleSheet.create({
    containerStyle: {
        backgroundColor: Colors.red,
    },
    swipeableContainerStyle: {
        backgroundColor: Colors.highlightPanelBackground,
        height: 54,
        ...StyleTemplates.flexHorizontalCenteredListContainer,
        paddingLeft: Sizes.horizontalPadding,
        paddingRight: Sizes.horizontalPadding,
    },
    discardButtonStyle: {
        backgroundColor: Colors.red,
        justifyContent: 'center',
        paddingLeft: Sizes.horizontalPadding,
        paddingRight: Sizes.horizontalPadding,

    },
    discardButtonTextStyle: {
        color: Colors.WHITE,
        fontSize: Sizes.smallFontSize,
        fontWeight: '500',
    },

    formButtonStyle: {
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: Platform.OS === 'android' ? "rgba(195,5,5,0.2)" : undefined,
        paddingLeft: 12,
        paddingRight: 12,
        height: Sizes.tinyTextButtonHeight,
        justifyContent: 'center',
        marginRight: 8
    },

    formButtonLabelStyle: {
        color: Colors.WHITE,
        fontSize: Sizes.smallFontSize
    },

    numDaysLabelStyle: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'right'
    },

    textInputAndroidStyle: {
        borderRadius: 8,
        borderColor: Colors.lightFormBackground,
        borderWidth: 1.5,
        paddingLeft: Sizes.horizontalPadding,
        paddingRight: Sizes.horizontalPadding,
        fontSize: Sizes.normalFontSize
    },

    dialogContainerStyle: { width: undefined },

    dialogPresetViewStyle: {
        ...StyleTemplates.flexHorizontalCenteredListContainer,
        justifyContent: 'space-between',
        padding: Sizes.horizontalPadding
    },

    dialogPresetButtonStyle: { marginLeft: 4, marginRight: 4, borderRadius: 6 },

    dialogPresetButtonContentStyle: { borderColor: Colors.accent + "88", borderWidth: 1, borderRadius: 6, padding: 6, backgroundColor: 'transparent' },

    dialogPresetButtonTextStyle: { fontSize: Sizes.smallFontSize, color: Colors.accent, fontWeight: '500' },

})

const pivot = startOfDay(new Date())

export const DataDrivenQueryBar = React.memo((props: {
    filter: DataDrivenQuery,
    highlightedDays: { [key: number]: boolean | undefined },
    onDiscardFilterPressed: () => void,
    onFilterModified: (newFilter: DataDrivenQuery) => void
}) => {

    const measureUnitType: MeasureUnitType = useSelector((appState: ReduxAppState) => appState.settingsState.unit)

    const comparisonTypes = useMemo(() => {
        return [NumericConditionType.Less, NumericConditionType.More, NumericConditionType.Min, NumericConditionType.Max].map(type => {
            return {
                type,
                label: getComparisonLabel(type, props.filter.dataSource)
            }
        })
    }, [props.filter.dataSource, props.filter.propertyKey])


    const dataSourceSpec = useMemo(() => {
        return dataSourceSpecs.find(s => s.dataSourceType === props.filter.dataSource && s.propertyKey === props.filter.propertyKey)!
    }, [props.filter.dataSource])

    const dataSourcePresets = useMemo(() => {
        if (typeof dataSourceSpec.presets === 'function') {
            return dataSourceSpec.presets(measureUnitType)
        } else return dataSourceSpec.presets
    }, [dataSourceSpec, measureUnitType])

    const renderRightActions = useCallback((progress: Animated.AnimatedInterpolation) => {
        const scale = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
            extrapolate: 'clamp'
        });

        const trans = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [100, 0],
            extrapolate: 'clamp'

        })

        return <RectButton style={styles.discardButtonStyle} onPress={props.onDiscardFilterPressed}>
            <Animated.Text style={{
                ...styles.discardButtonTextStyle,
                transform: [{ translateX: trans }, { scale }]
            }}>Discard</Animated.Text>
        </RectButton>
    }, [props.onDiscardFilterPressed])

    const getLabel = useCallback((v) => v.label, [])

    const valueFormatter = useMemo(() => (value: number) => {
        value = DataSourceManager.instance.convertValue(value, props.filter.dataSource, measureUnitType)

        switch (props.filter.dataSource) {
            case DataSourceType.StepCount:
                return commaNumber(value)
            case DataSourceType.SleepRange: {
                const time = addSeconds(pivot, value)
                switch (getHours(time)) {
                    case 0:
                    case 24:
                        return "Midnight"
                    case 12: return "Noon"
                    default: return format(time, "hh:mm a")
                }
            }
            case DataSourceType.HoursSlept:
                return DateTimeHelper.formatDuration(value, true)
            case DataSourceType.HeartRate:
                return `${value} bpm`
            case DataSourceType.Weight:
                {
                    switch (measureUnitType) {
                        case MeasureUnitType.Metric:
                            return `${Math.round(value)} kg`
                        case MeasureUnitType.US:
                            return `${Math.round(value)} lb`
                    }
                }
            default: return value.toString()
        }
    }, [props.filter.dataSource, measureUnitType])

    const getKeyOfDataSource = useCallback((t: SpecType) => ({ dataSourceType: t.dataSourceType, propertyKey: t.propertyKey }), [])

    const onDataSourceChanged = useCallback((key: { dataSourceType: DataSourceType, propertyKey?: string }) => {

        if (props.filter.dataSource !== key.dataSourceType || props.filter.propertyKey !== key.propertyKey) {
            const newFilter = {
                ...props.filter,
                dataSource: key.dataSourceType,
                propertyKey: key.propertyKey,
                ref: (props.filter.type !== NumericConditionType.Max && props.filter.type !== NumericConditionType.Min) ? getDefaultReference(key.dataSourceType, key.propertyKey) : undefined
            }
            props.onFilterModified(newFilter)
        }
    }, [props.filter, props.onFilterModified])

    const onComparisonTypeChanged = useCallback((key: NumericConditionType) => {
        const newFilter = {
            ...props.filter,
            type: key
        }
        if(newFilter.ref == null && newFilter.type !== NumericConditionType.Max && newFilter.type !== NumericConditionType.Min){
            //if the condition type requires a reference value but not, use the default reference value.
            newFilter.ref = getDefaultReference(newFilter.dataSource, newFilter.propertyKey)
        }

        props.onFilterModified(newFilter)
    }, [props.filter, props.onFilterModified])

    const getKeyOfComparisonType = useCallback((t) => t.type, [])

    const [showReferenceEditView, setShowReferenceEditView] = useState(false)

    const [inputReferenceValue, setInputReferenceValue] = useState<number | undefined | null>(null)

    useEffect(() => {
        setInputReferenceValue(props.filter.ref)
    }, [props.filter.ref])

    const onPressReferenceValue = useCallback(() => {
        setShowReferenceEditView(true)
    }, [setShowReferenceEditView])

    const handleOkReferenceEdit = useCallback(() => {
        setShowReferenceEditView(false)
        const newFilter = {
            ...props.filter,
            ref: inputReferenceValue
        } as DataDrivenQuery
        props.onFilterModified(newFilter)
    }, [inputReferenceValue, props.onFilterModified])

    const handleCancelReferenceEdit = useCallback(() => {
        setShowReferenceEditView(false)
    }, [])

    const heartRateInputChange = useCallback(index => {
        setInputReferenceValue(HEART_RATE_RANGE[index])
    }, [])

    const onInputTextChange = useCallback((text: string) => {
        setInputReferenceValue(text.length > 0 ? DataSourceManager.instance
            .convertValueReverse(Number.parseFloat(text), props.filter.dataSource, measureUnitType) : null)
    }, [props.filter.dataSource, measureUnitType])


    const calcTimeOfDay = useMemo(() => (propertyKey: "waketime" | "bedtime", date: Date) => {
        let result = getHours(date) * 3600 + getMinutes(date) * 60
        result %= 24 * 3600
        if (propertyKey === 'bedtime' && result > BEDTIME_SHIFT_HOUR_OF_DAY * 3600) {
            result -= 24 * 3600
        }
        return result
    }, [])

    const onTimePickerValueChange = Platform.OS === 'ios' ? useCallback((ev, value) => {
        setInputReferenceValue(calcTimeOfDay(props.filter.propertyKey as any, value))
    }, [setInputReferenceValue]) : useCallback((value) => {
        setInputReferenceValue(calcTimeOfDay(props.filter.propertyKey as any, value))
    }, [props.filter.propertyKey])

    const onDurationChange = useCallback((duration) => {
        setInputReferenceValue(duration)
    }, [])

    const inputView = useMemo(() => () => {
        switch (props.filter.dataSource) {
            case DataSourceType.SleepRange:
                return Platform.OS === 'ios' ? <DateTimePicker mode="time"
                    value={addSeconds(pivot, inputReferenceValue)}
                    onChange={onTimePickerValueChange}
                    minuteInterval={10}
                    display="spinner" /> :
                    <TimePicker
                        selectedItemTextFontFamily={undefined}
                        itemTextFontFamily={undefined}
                        selectedItemTextSize={18}
                        itemTextSize={18}
                        initDate={addSeconds(pivot, inputReferenceValue) as any}
                        onTimeSelected={onTimePickerValueChange as any} />
            case DataSourceType.HoursSlept:
                return <DurationWheelPicker durationSeconds={inputReferenceValue} onDurationChange={onDurationChange} />

            case DataSourceType.HeartRate:
                {
                    const index = clamp(Math.round(inputReferenceValue) - HEART_RATE_RANGE[0], 0, HEART_RATE_RANGE.length - 1)
                    return <WheelPicker
                        selectedItemTextFontFamily={undefined}
                        itemTextFontFamily={undefined}
                        style={StyleTemplates.wheelPickerCommonStyle}
                        data={HEART_RATE_RANGE_TEXTS}
                        initPosition={index}
                        selectedItem={index}
                        onItemSelected={heartRateInputChange}
                    />
                }
            case DataSourceType.Weight:

                {
                    let labels;
                    switch (measureUnitType) {
                        case MeasureUnitType.Metric:
                            labels = WEIGHT_RANGE_TEXTS_KG
                            break;
                        case MeasureUnitType.US:
                            labels = WEIGHT_RANGE_TEXTS_LB
                            break;
                    }
                    const index = clamp(Math.round(DataSourceManager.instance.convertValue(inputReferenceValue, DataSourceType.Weight, measureUnitType)) - WEIGHT_RANGE[0], 0, WEIGHT_RANGE.length - 1)
                    return <WheelPicker
                        selectedItemTextFontFamily={undefined}
                        itemTextFontFamily={undefined}
                        style={StyleTemplates.wheelPickerCommonStyle}
                        data={labels}
                        initPosition={index}
                        selectedItem={index}
                        onItemSelected={(index) => {
                            const selectedNumber = WEIGHT_RANGE[index]
                            setInputReferenceValue(DataSourceManager.instance.convertValueReverse(selectedNumber, DataSourceType.Weight, measureUnitType))
                        }}
                    />
                }

            default: return <Dialog.Input
                style={Platform.OS === 'android' ? styles.textInputAndroidStyle : undefined}
                autoFocus={true}
                numberOfLines={1}
                keyboardType="number-pad"
                selectTextOnFocus={true}
                onChangeText={onInputTextChange}
            >{DataSourceManager.instance.convertValue(inputReferenceValue, props.filter.dataSource, measureUnitType)}</Dialog.Input>
        }
    }, [props.filter.dataSource, measureUnitType, onInputTextChange, inputReferenceValue, onTimePickerValueChange])

    return <Swipeable
        renderRightActions={renderRightActions}
        containerStyle={styles.containerStyle}
    >
        <View style={styles.swipeableContainerStyle}>
            <CategoryFormButton<SpecType, { dataSourceType: DataSourceType, propertyKey?: string }>
                values={dataSourceSpecs}
                getLabel={getLabel}
                currentKey={{ dataSourceType: props.filter.dataSource, propertyKey: props.filter.propertyKey }}
                getKey={getKeyOfDataSource}
                onChanged={onDataSourceChanged}
            />

            <CategoryFormButton<{ type: NumericConditionType, label: string }, NumericConditionType> values={comparisonTypes}
                getLabel={getLabel}
                currentKey={props.filter.type}
                getKey={getKeyOfComparisonType}
                onChanged={onComparisonTypeChanged}
            />
            {(props.filter.type !== NumericConditionType.Max && props.filter.type !== NumericConditionType.Min)
                ? <FormButton onPress={onPressReferenceValue} value={valueFormatter(props.filter.ref!)} /> : null}

            <Text style={styles.numDaysLabelStyle}>{pluralize('day', props.highlightedDays != null ? Object.keys(props.highlightedDays).length : 0, true)}</Text>

            <Dialog.Container contentStyle={styles.dialogContainerStyle} visible={showReferenceEditView} onBackdropPress={handleCancelReferenceEdit}>
                <Dialog.Title>Change Reference Value</Dialog.Title>
                {inputView()}

                {
                    dataSourcePresets != null ? <View style={styles.dialogPresetViewStyle}>
                        {
                            dataSourcePresets.map((preset, i) =>
                                <Button key={i.toString()} 
                                containerStyle={styles.dialogPresetButtonStyle} 
                                buttonStyle={styles.dialogPresetButtonContentStyle}
                                titleStyle={styles.dialogPresetButtonTextStyle}
                                title={valueFormatter(preset)}
                                
                                onPress={() => { 
                                    console.log("set input reference:", preset)
                                    setInputReferenceValue(preset) 
                                    }}/>)
                        }
                    </View> : null
                }

                <Dialog.Button label="Cancel" onPress={handleCancelReferenceEdit} />
                <Dialog.Button label="Apply"
                    onPress={handleOkReferenceEdit}
                    color={inputReferenceValue != null ? undefined : Colors.textGray}
                    disabled={inputReferenceValue == null} />
            </Dialog.Container>
        </View>
    </Swipeable>
})





//========================================

interface CategoryFormButtonProps<T, KeyType> {
    values: Array<T>,
    getLabel: (value: T) => string,
    getKey: (value: T) => KeyType,
    currentKey: KeyType,
    onChanged: (key: KeyType) => void
}

function CategoryFormButton<T, KeyType>(props: CategoryFormButtonProps<T, KeyType>) {

    const buttonRef = useRef()

    const onPress = useCallback(() => {
        const selections = props.values.map(v => props.getLabel(v))
        if (Platform.OS === 'ios') {
            selections.push("Cancel")
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: selections,
                    cancelButtonIndex: selections.length - 1,
                }, buttonIndex => {

                    if (buttonIndex != selections.length - 1 && props.getKey(props.values[buttonIndex]) !== props.currentKey) {
                        props.onChanged(props.getKey(props.values[buttonIndex]))
                    }
                })
        } else if (Platform.OS === 'android') {
            UIManager.showPopupMenu(findNodeHandle(buttonRef.current), selections, () => { }, (item, buttonIndex) => {

                if (buttonIndex != null && props.getKey(props.values[buttonIndex]) !== props.currentKey) {
                    props.onChanged(props.getKey(props.values[buttonIndex]))
                }
            })
        }
    }, [props.values, props.getLabel, props.currentKey, props.getKey])

    const value = useMemo(() => props.getLabel(props.values.find((v) => {
        if (typeof props.currentKey === 'object') {
            return deepEqual(props.getKey(v), props.currentKey)
        } else return props.getKey(v) === props.currentKey
    })), [props.getLabel, props.values, props.currentKey, props.getKey])

    return <FormButton ref={buttonRef}
        onPress={onPress}
        value={value} />
}

const FormButton = React.forwardRef((props: {
    value: string,
    onPress: () => void,
    children?: any
}, ref: any) => {
    return <RectButton ref={ref} hitSlop={{ top: 10, bottom: 10 }} style={styles.formButtonStyle} onPress={props.onPress}>
        <Text style={styles.formButtonLabelStyle}>{props.value}</Text>
    </RectButton>
})