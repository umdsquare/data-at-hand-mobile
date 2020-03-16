import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { HighlightFilter, NumericConditionType } from '@core/exploration/types'
import { View, StyleSheet, Text, Animated, Platform } from 'react-native'
import Colors from '@style/Colors'
import { DataSourceManager } from '@measure/DataSourceManager'
import { StyleTemplates } from '@style/Styles'
import { Sizes } from '@style/Sizes'
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { RectButton } from 'react-native-gesture-handler'
import { DataSourceType } from '@measure/DataSourceSpec'
import { useActionSheet } from '@expo/react-native-action-sheet'
import pluralize from 'pluralize';
import deepEqual from 'deep-equal';
import Dialog from 'react-native-dialog'
import { DateTimeHelper } from '@utils/time'
import { startOfDay, addSeconds, format, getHours, getMinutes } from 'date-fns'
import commaNumber from 'comma-number'
import DateTimePicker from '@react-native-community/datetimepicker';
import { TimePicker } from "react-native-wheel-picker-android";
import { DurationWheelPicker } from '../common/DurationWheelPicker'

type SpecType = { dataSourceType: DataSourceType, propertyKey?: string | null, label: string }
const dataSourceSpecs: Array<SpecType> = [
    { dataSourceType: DataSourceType.StepCount, propertyKey: undefined, label: DataSourceManager.instance.getSpec(DataSourceType.StepCount).name },
    { dataSourceType: DataSourceType.HeartRate, propertyKey: undefined, label: "Resting HR" },
    { dataSourceType: DataSourceType.HoursSlept, propertyKey: undefined, label: DataSourceManager.instance.getSpec(DataSourceType.HoursSlept).name },
    { dataSourceType: DataSourceType.SleepRange, propertyKey: "waketime", label: "Wake Time" },
    { dataSourceType: DataSourceType.SleepRange, propertyKey: "bedtime", label: "Bedtime" },
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

function getDefaultReference(dataSource: DataSourceType, propertyKey: string | undefined): number{
    switch (dataSource) {
        case DataSourceType.StepCount: return 10000
        case DataSourceType.HeartRate: return 80
        case DataSourceType.SleepRange:
            switch (propertyKey) {
                case 'waketime': return 8*3600
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
        color: 'white',
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
        color: 'white',
        fontSize: Sizes.smallFontSize
    },

    numDaysLabelStyle: {
        color: 'white',
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
    }
})

const pivot = startOfDay(new Date())

export const HighlightFilterPanel = React.memo((props: {
    filter: HighlightFilter,
    highlightedDays: { [key: number]: boolean | undefined },
    onDiscardFilterPressed: () => void,
    onFilterModified: (newFilter: HighlightFilter) => void
}) => {


    const comparisonTypes = useMemo(() => {
        return [NumericConditionType.Less, NumericConditionType.More, NumericConditionType.Min, NumericConditionType.Max].map(type => {
            return {
                type,
                label: getComparisonLabel(type, props.filter.dataSource)
            }
        })
    }, [props.filter.dataSource, props.filter.propertyKey])



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
        switch (props.filter.dataSource) {
            case DataSourceType.StepCount:
                return commaNumber(value)
            case DataSourceType.SleepRange:
                return format(addSeconds(pivot, value), "hh:mm a")
            case DataSourceType.HoursSlept:
                return DateTimeHelper.formatDuration(value, true)
            default: return value.toString()
        }
    }, [props.filter.dataSource])

    const getKeyOfDataSource = useCallback((t: SpecType) => ({ dataSourceType: t.dataSourceType, propertyKey: t.propertyKey }), [])

    const onDataSourceChanged = useCallback((key: { dataSourceType: DataSourceType, propertyKey?: string }) => {

        if (props.filter.dataSource !== key.dataSourceType) {
            const newFilter = {
                ...props.filter,
                dataSource: key.dataSourceType,
                propertyKey: key.propertyKey,
                ref: (props.filter.type !== NumericConditionType.Max && props.filter.type !== NumericConditionType.Min)? getDefaultReference(key.dataSourceType, key.propertyKey) : undefined
            }
            props.onFilterModified(newFilter)
        }
    }, [props.filter, props.onFilterModified])

    const onComparisonTypeChanged = useCallback((key: NumericConditionType) => {
        const newFilter = {
            ...props.filter,
            type: key
        }
        props.onFilterModified(newFilter)
    }, [props.filter, props.onFilterModified])

    const getKeyOfComparisonType = useCallback((t) => t.type, [])

    const [showReferenceEditView, setShowReferenceEditView] = useState(false)

    const [inputReferenceValue, setInputReferenceValue] = useState(null)

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
        }
        props.onFilterModified(newFilter)
    }, [inputReferenceValue, props.onFilterModified])

    const handleCancelReferenceEdit = useCallback(() => {
        setShowReferenceEditView(false)
    }, [])

    const onInputTextChange = useCallback((text: string) => {
        setInputReferenceValue(text.length > 0 ? Number.parseInt(text) : null)
    }, [])

    const onTimePickerValueChange = Platform.OS === 'ios' ? useCallback((ev, value) => {
        setInputReferenceValue(getHours(value) * 3600 + getMinutes(value) * 60)
    }, [setInputReferenceValue]) : useCallback((value) => {
        setInputReferenceValue(getHours(value) * 3600 + getMinutes(value) * 60)
    }, [])

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
                return <DurationWheelPicker durationSeconds={inputReferenceValue} onDurationChange={onDurationChange}/>
            default: return <Dialog.Input
                style={Platform.OS === 'android' ? styles.textInputAndroidStyle : undefined}
                autoFocus={true}
                numberOfLines={1}
                keyboardType="number-pad"
                selectTextOnFocus={true}
                onChangeText={onInputTextChange}
            >{inputReferenceValue}</Dialog.Input>
        }
    }, [props.filter.dataSource, onInputTextChange, inputReferenceValue, onTimePickerValueChange])

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

            <Dialog.Container visible={showReferenceEditView} onBackdropPress={handleCancelReferenceEdit}>
                <Dialog.Title>Change Reference Value</Dialog.Title>
                {inputView()}

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

    const { showActionSheetWithOptions } = useActionSheet();

    const onPress = useCallback(() => {
        const selections = props.values.map(v => props.getLabel(v))
        selections.push("Cancel")
        showActionSheetWithOptions(
            {
                options: selections,
                cancelButtonIndex: selections.length - 1,
                destructiveButtonIndex: selections.length - 1,
                showSeparators: true,
            }, buttonIndex => {
                if (buttonIndex != selections.length - 1 && props.getKey(props.values[buttonIndex]) !== props.currentKey) {
                    props.onChanged(props.getKey(props.values[buttonIndex]))
                }
            })
    }, [props.values, props.getLabel, props.currentKey, props.getKey])

    const value = useMemo(() => props.getLabel(props.values.find((v) => {
        if (typeof props.currentKey === 'object') {
            return deepEqual(props.getKey(v), props.currentKey)
        } else return props.getKey(v) === props.currentKey
    })), [props.getLabel, props.values, props.currentKey, props.getKey])

    return <FormButton
        onPress={onPress}
        value={value} />
}

const FormButton = (props: {
    value: string,
    onPress: () => void
}) => {
    return <RectButton hitSlop={{ top: 10, bottom: 10 }} style={styles.formButtonStyle} onPress={props.onPress}>
        <Text style={styles.formButtonLabelStyle}>{props.value}</Text>
    </RectButton>
}