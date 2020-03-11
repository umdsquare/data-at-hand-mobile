import React, { useCallback, useMemo } from 'react'
import { HighlightFilter, NumericConditionType } from '../../core/exploration/types'
import { View, StyleSheet, Text, Animated } from 'react-native'
import Colors from '../../style/Colors'
import { DataSourceManager } from '../../system/DataSourceManager'
import { StyleTemplates } from '../../style/Styles'
import { Sizes } from '../../style/Sizes'
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { RectButton } from 'react-native-gesture-handler'
import { DataSourceType } from '../../measure/DataSourceSpec'
import { useActionSheet } from '@expo/react-native-action-sheet'
import deepEqual from 'deep-equal';

type SpecType = { dataSourceType: DataSourceType, propertyKey?: string | null, label: string }
const dataSourceSpecs: Array<SpecType> = [
    { dataSourceType: DataSourceType.StepCount, propertyKey: undefined, label: DataSourceManager.instance.getSpec(DataSourceType.StepCount).name },
    { dataSourceType: DataSourceType.HeartRate, propertyKey: undefined, label: DataSourceManager.instance.getSpec(DataSourceType.HeartRate).name },
    { dataSourceType: DataSourceType.HoursSlept, propertyKey: undefined, label: DataSourceManager.instance.getSpec(DataSourceType.HoursSlept).name },
    { dataSourceType: DataSourceType.SleepRange, propertyKey: "waketime", label: "Wake Time" },
    { dataSourceType: DataSourceType.SleepRange, propertyKey: "bedtime", label: "Bedtime" },
    { dataSourceType: DataSourceType.Weight, propertyKey: undefined, label: DataSourceManager.instance.getSpec(DataSourceType.Weight).name },
]

function getComparisonLabel(type: NumericConditionType, dataSource: DataSourceType, propertyKey?: string): string {
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
        paddingLeft: 12,
        paddingRight: 12,
        height: Sizes.tinyTextButtonHeight,
        justifyContent: 'center',
        marginRight: 8
    },

    formButtonLabelStyle: {
        color: 'white'
    }
})

export const HighlightFilterPanel = React.memo((props: {
    filter: HighlightFilter,
    onDiscardFilterPressed: () => void,
    onFilterModified: (newFilter: HighlightFilter) => void
}) => {

    const comparisonTypes = useMemo(() => {
        return [NumericConditionType.Less, NumericConditionType.More, NumericConditionType.Min, NumericConditionType.Max].map(type => {
            return {
                type,
                label: getComparisonLabel(type, props.filter.dataSource, props.filter.propertyKey)
            }
        })
    }, [props.filter.dataSource, props.filter.propertyKey])



    const renderRightActions = useCallback((progress: Animated.Value, dragX) => {
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

    const getKeyOfDataSource = useCallback((t: SpecType) => ({ dataSourceType: t.dataSourceType, propertyKey: t.propertyKey }), [])

    const onDataSourceChanged = useCallback((key: { dataSourceType: DataSourceType, propertyKey?: string }) => {
        const newFilter = {
            ...props.filter,
            dataSource: key.dataSourceType,
            propertyKey: key.propertyKey
        }
        props.onFilterModified(newFilter)
    }, [props.filter, props.onFilterModified])

    const onComparisonTypeChanged = useCallback((key: NumericConditionType) => {
        const newFilter = {
            ...props.filter,
            type: key
        }
        props.onFilterModified(newFilter)
    }, [props.filter, props.onFilterModified])

    const getKeyOfComparisonType = useCallback((t) => t.type, [])

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
            {props.filter.ref ? <FormButton onPress={() => { }} value={props.filter.ref.toFixed(0)} /> : null}
        </View>
    </Swipeable>
})

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
        showActionSheetWithOptions({
            options: selections,
            cancelButtonIndex: selections.length - 1,

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
    return <RectButton style={styles.formButtonStyle} onPress={props.onPress}><Text style={styles.formButtonLabelStyle}>{props.value}</Text></RectButton>
}