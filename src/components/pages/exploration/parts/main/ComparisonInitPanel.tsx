import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Text, LayoutAnimation } from 'react-native'
import { Button } from 'react-native-elements'
import LinearGradient from 'react-native-linear-gradient'
import Colors from '@style/Colors'
import { Sizes } from '@style/Sizes'
import { ExplorationInfo, ParameterType, ExplorationType, ParameterKey } from '@data-at-hand/core/exploration/ExplorationInfo'
import { DataSourceType } from '@data-at-hand/core/measure/DataSourceSpec'
import { CyclicTimeFrame, cyclicTimeFrameSpecs } from '@data-at-hand/core/exploration/CyclicTimeFrame'
import { explorationInfoHelper } from '@core/exploration/ExplorationInfoHelper'
import { useDispatch } from 'react-redux'
import { createGoToComparisonTwoRangesAction, InteractionType, createGoToComparisonCyclicAction } from '@state/exploration/interaction/actions'
import { CategoricalRow } from '@components/exploration/CategoricalRow'
import { DataSourceManager } from '@measure/DataSourceManager'
import { DataSourceIcon } from '@components/common/DataSourceIcon'
import { DateRangeBar } from '@components/exploration/DateRangeBar'
import { StyleTemplates } from '@style/Styles'
import { DateTimeHelper } from '@data-at-hand/core/utils/time'
import { subDays } from 'date-fns'
import { SvgIcon, SvgIconType } from '@components/common/svg/SvgIcon'

const styles = StyleSheet.create({
    containerStyle: { paddingLeft: Sizes.horizontalPadding * .5, paddingRight: Sizes.horizontalPadding * .5 },
    buttonContainerStyle: { marginTop: Sizes.verticalPadding, marginLeft: Sizes.horizontalPadding * .5, marginRight: Sizes.horizontalPadding * .5 },
    buttonStyle: { borderRadius: 50, paddingTop: Sizes.verticalPadding, paddingBottom: Sizes.verticalPadding },
    titleStyle: { fontSize: Sizes.normalFontSize, fontWeight: 'bold' },
    disabledTitleStyle: { color: Colors.WHITE },
    disabledStyle: { opacity: 0.5 },

    rangeSeparatorLineStyle: { height: 1, flex: 1, backgroundColor: Colors.lightBorderColor },
    rangeSeparatorTextStyle: { marginLeft: 8, marginRight: 8, color: Colors.textColorLight },

    rangeSeparatorStyle: {
        ...StyleTemplates.flexHorizontalCenteredListContainer,
        paddingLeft: Sizes.horizontalPadding,
        paddingRight: Sizes.horizontalPadding,
    }
})
const iconInfo = <SvgIcon style={{marginLeft: 4}} type={SvgIconType.ArrowForward} color={Colors.WHITE}/>

const gradientProps = { colors: Colors.decisionButtonGradient, start: { x: 0, y: 0 }, end: { x: 1, y: 0 } }

const CompareTwoRangesLabel = "Compare Two Ranges"
const comparisonTypes = Object.keys(cyclicTimeFrameSpecs).map(type => cyclicTimeFrameSpecs[type].name)
comparisonTypes.push(CompareTwoRangesLabel)

function inferRange(info: ExplorationInfo): [number, number] {
    const date = explorationInfoHelper.getParameterValue<number>(info, ParameterType.Date)
    if (date != null) {
        return [DateTimeHelper.toNumberedDateFromDate(subDays(DateTimeHelper.toDate(date), 6)), date]
    }
}

export const ComparisonInitPanel = (props: { info: ExplorationInfo, onCompleted?: () => void }) => {

    const [dataSource, setDataSource] = useState<DataSourceType>(explorationInfoHelper.getParameterValue(props.info, ParameterType.DataSource) || DataSourceType.StepCount)
    const [cycleType, setCycleType] = useState<CyclicTimeFrame | "compareTwoRanges">(
        explorationInfoHelper.getParameterValue(props.info, ParameterType.CycleType) || (props.info.type === ExplorationType.C_TwoRanges ? "compareTwoRanges" : CyclicTimeFrame.DayOfWeek))
    const [rangeA, setRangeA] = useState<[number, number]>(explorationInfoHelper.getParameterValue(props.info, ParameterType.Range) || inferRange(props.info))
    const [rangeB, setRangeB] = useState<[number, number]>(explorationInfoHelper.getParameterValue(props.info, ParameterType.Range, ParameterKey.RangeB))

    const dispatch = useDispatch()

    useEffect(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)

        if (cycleType === 'compareTwoRanges' && rangeB == null) {
            setRangeB(DateTimeHelper.pageRange(rangeA[0], rangeA[1], -1))
        }
    }, [cycleType])

    return <View style={styles.containerStyle}>
        <CategoricalRow title="Data Source" isLightMode={true} value={DataSourceManager.instance.getSpec(dataSource).name}
            useSpeechIndicator={false}
            values={DataSourceManager.instance.supportedDataSources.map(s => s.name)}
            onValueChange={(value, index) => { setDataSource(DataSourceManager.instance.supportedDataSources[index].type) }}
            IconComponent={DataSourceIcon}
            iconProps={(index) => ({
                type: DataSourceManager.instance.supportedDataSources[index].type
            })}
            showBorder={true} />
        <CategoricalRow title="Comparison Type"
            useSpeechIndicator={false}
            isLightMode={true}
            value={cycleType === 'compareTwoRanges' ? CompareTwoRangesLabel : cyclicTimeFrameSpecs[cycleType].name}
            values={comparisonTypes}
            onValueChange={(value, index) => {
                const newCycleType = Object.keys(cyclicTimeFrameSpecs).find(type => cyclicTimeFrameSpecs[type].name === value)
                setCycleType(newCycleType || "compareTwoRanges" as any)
            }}
            showBorder={true} />

        <View style={{ marginBottom: 16 }} />

        <DateRangeBar
            from={rangeA[0]}
            to={rangeA[1]}
            showSpeechIndicator={false}
            isLightMode={true}
            onRangeChanged={(from, to) => {
                setRangeA([from, to])
            }}
        />

        {
            cycleType === 'compareTwoRanges' ? <View style={styles.rangeSeparatorStyle}>
                <View style={styles.rangeSeparatorLineStyle} />
                <Text style={styles.rangeSeparatorTextStyle}>Vs.</Text>
                <View style={styles.rangeSeparatorLineStyle} />
            </View> : null
        }

        {
            cycleType === 'compareTwoRanges' && rangeB ? <DateRangeBar
                from={rangeB[0]}
                to={rangeB[1]}
                showSpeechIndicator={false}
                isLightMode={true}
                onRangeChanged={(from, to) => {
                    setRangeB([from, to])
                }}
            /> : null
        }

        <Button
            containerStyle={styles.buttonContainerStyle}
            ViewComponent={LinearGradient}
            linearGradientProps={gradientProps}
            buttonStyle={styles.buttonStyle}
            iconRight={true}
            icon={iconInfo}
            titleStyle={styles.titleStyle}
            title="Start Comparison"
            disabledStyle={styles.disabledStyle}
            disabledTitleStyle={styles.disabledTitleStyle}
            disabled={dataSource == null || cycleType == null || rangeA == null || (cycleType === 'compareTwoRanges' && rangeB == null)}
            onPress={() => {
                if (cycleType === 'compareTwoRanges') {
                    dispatch(createGoToComparisonTwoRangesAction(InteractionType.TouchOnly, dataSource, rangeA, rangeB))
                    if (props.onCompleted) {
                        props.onCompleted()
                    }
                } else {
                    dispatch(createGoToComparisonCyclicAction(InteractionType.TouchOnly, dataSource, rangeA, cycleType))
                    if (props.onCompleted) {
                        props.onCompleted()
                    }
                }
            }}
        />
    </View>
}

