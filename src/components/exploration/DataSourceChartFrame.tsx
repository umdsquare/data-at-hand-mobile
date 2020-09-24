import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@style/Colors';
import { Sizes } from '@style/Sizes';
import { DataSourceType, MeasureUnitType } from '@data-at-hand/core/measure/DataSourceSpec';
import { DataSourceManager } from '@measure/DataSourceManager';
import { OverviewSourceRow, StatisticsType, WeightRangedData } from '@core/exploration/data/types';
import commaNumber from 'comma-number';
import { DateTimeHelper } from '@data-at-hand/core/utils/time';
import { startOfDay, addSeconds, format } from 'date-fns';
import { scaleLinear } from 'd3-scale';
import { DataDrivenQuery } from '@data-at-hand/core/exploration/ExplorationInfo';
import { DataSourceIcon } from '@components/common/DataSourceIcon';
import { DailyBarChart } from '@components/visualization/browse/DailyBarChart';
import { DailyHeartRateChart } from '@components/visualization/browse/DailyHeartRateChart';
import { DailySleepRangeChart } from '@components/visualization/browse/DailySleepRangeChart';
import { DailyWeightChart } from '@components/visualization/browse/DailyWeightChart';
import { StyleTemplates } from '@style/Styles';
import { useSelector } from 'react-redux';
import { ReduxAppState } from '@state/types';


const lightTextColor = "#8b8b8b"

export const HEADER_HEIGHT = 60
export const FOOTER_HEIGHT = 52

const containerStyle = {
    backgroundColor: Colors.WHITE,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowColor: 'black',
    shadowOpacity: 0.07
}

const styles = StyleSheet.create({
    containerStyle: containerStyle,
    containerStyleFlat: {
        ...containerStyle,
        shadowOffset: undefined,
        shadowColor: undefined,
        shadowRadius: undefined,
        shadowOpacity: undefined,
        borderBottomColor: 'gray',
        borderBottomWidth: 1,
        paddingBottom: 6,
        paddingTop: 16
    },

    headerStyle: {
        height: HEADER_HEIGHT,
        flexDirection: "row",
        alignItems: 'center',
    },

    headerTitleStyle: {
        fontWeight: 'bold',
        color: Colors.textColorLight,
        fontSize: Sizes.normalFontSize,
        flex: 1
    },

    headerClickRegionWrapperStyle: { flex: 1, marginRight: 15 },

    headerClickRegionStyle: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', height: HEADER_HEIGHT },

    headerDescriptionTextStyle: {
        fontWeight: '500',
        color: lightTextColor,
        fontSize: 14
    },

    todayButtonStyle: {
        height: HEADER_HEIGHT * 0.7, justifyContent: 'center',
        paddingRight: Sizes.horizontalPadding, paddingLeft: Sizes.horizontalPadding
    },

    todayUnitStyle: {
        fontWeight: '300',
        color: '#9B9B9B'
    },

    todayValueStyle: {
        color: Colors.today,
        fontWeight: 'bold'
    },

    iconStyle: {
        marginLeft: Sizes.horizontalPadding,
        marginRight: 8,
    },

    chartAreaStyle: {
        padding: 0,
        aspectRatio: 3
    },

    footerStyle: {
        ...StyleTemplates.flexHorizontalCenteredListContainer,
        padding: Sizes.horizontalPadding,
        justifyContent: 'space-around',
        height: FOOTER_HEIGHT
    },

    statValueStyle: {
        fontSize: 14,
        fontWeight: '500',
        color: lightTextColor
    },

    statLabelStyle: {
        fontSize: Sizes.tinyFontSize,
        color: '#Bababa',
        fontWeight: 'normal'
    }
})

export interface TodayInfo {
    label: string;
    formatted: Array<{ text: string; type: 'unit' | 'value' }> | null;
}

function formatTodayValue(dataSource: DataSourceType, todayData: number | [number, number] | null, unitType: MeasureUnitType): TodayInfo {
    const info = {

    } as TodayInfo

    switch (dataSource) {
        case DataSourceType.Weight:
            info.label = "Recently"
            break;
        case DataSourceType.SleepRange:
        case DataSourceType.HoursSlept:
            info.label = "Last night"
            break;
        default: info.label = "Today"
            break;
    }

    switch (dataSource) {
        case DataSourceType.StepCount:
            info.formatted = todayData != null ? [
                {
                    text: commaNumber(todayData as number),
                    type: 'value',
                },
                { text: ' steps', type: 'unit' },
            ] : null
            break;
        case DataSourceType.HeartRate:
            info.formatted = todayData != null ? [
                {
                    text: todayData.toString(),
                    type: 'value',
                },
                {
                    text: ' bpm',
                    type: 'unit',
                },
            ] : null
            break;
        case DataSourceType.Weight:
            if (todayData) {
                switch (unitType) {
                    case MeasureUnitType.Metric:
                        info.formatted = [{ type: 'value', text: (todayData as number).toFixed(1) }, { type: 'unit', text: ' kg' }]
                        break;
                    case MeasureUnitType.US:
                        const convert = require('convert-units')
                        info.formatted = [{ type: 'value', text: convert(todayData).from('kg').to('lb').toFixed(1) }, { type: 'unit', text: ' lb' }]
                        break;
                }
            } else {
                info.formatted = null
            }
            break;
        case DataSourceType.HoursSlept:
            if (todayData) {
                var roundedSecs = todayData as number
                info.formatted = []
                if (roundedSecs % 60 >= 30) {
                    roundedSecs = roundedSecs - (roundedSecs % 60) + 60
                }
                const hours = Math.floor(roundedSecs / 3600)
                const minutes = Math.floor((roundedSecs % 3600) / 60)
                if (hours > 0) {
                    info.formatted.push({ type: 'value', text: hours + " " })
                    info.formatted.push({ type: 'unit', text: "hr" + (minutes > 0 ? " " : "") })
                }

                if (hours > 0 && minutes > 0 || hours === 0) {
                    info.formatted.push({ type: 'value', text: minutes + " " })
                    info.formatted.push({ type: 'unit', text: 'min' })
                }
            } else {
                info.formatted = null
            }
            break;
        case DataSourceType.SleepRange:
            if (todayData) {
                const pivot = startOfDay(new Date())
                const actualBedTime = addSeconds(pivot, Math.round((todayData as any)[0]))
                const actualWakeTime = addSeconds(pivot, Math.round((todayData as any)[1]))

                info.formatted = [
                    { type: 'value', text: format(actualBedTime, 'hh:mm ') },
                    { type: 'unit', text: format(actualBedTime, 'a').toLowerCase() },
                    { type: 'unit', text: ' - ' },
                    { type: 'value', text: format(actualWakeTime, 'hh:mm ') },
                    { type: 'unit', text: format(actualWakeTime, 'a').toLowerCase() },
                ]
            } else {
                info.formatted = null
            }
            break;
    }

    return info
}

function getStatisticsLabel(type: StatisticsType): string {
    switch (type) {
        case 'avg': return "Avg."
        case 'range': return 'Range'
        case 'total': return 'Total'
        case 'bedtime': return 'Avg. Bedtime'
        case 'waketime': return 'Avg. Wake Time'

    }
}

function formatStatistics(sourceType: DataSourceType, statisticsType: StatisticsType, measureUnitType: MeasureUnitType, value: any): string {
    switch (sourceType) {
        case DataSourceType.StepCount:
            switch (statisticsType) {
                case "avg": return commaNumber(Math.round(value));
                case "range": return commaNumber(value[0]) + " - " + commaNumber(value[1])
                case "total": return commaNumber(value)
            }
        case DataSourceType.HeartRate:
            switch (statisticsType) {
                case 'avg': return `${Math.round(value).toString()} bpm`
                case 'range': return `${value[0]}  - ${value[1]} bpm`
            }
        case DataSourceType.Weight:
            switch (measureUnitType) {
                case MeasureUnitType.Metric:
                    break;
                case MeasureUnitType.US:
                    {
                        const convert = require('convert-units')
                        if (statisticsType == 'range') {
                            value = [convert(value[0]).from('kg').to('lb'), convert(value[1]).from('kg').to('lb')]
                        } else {
                            value = convert(value).from('kg').to('lb')
                        }
                    }
                    break;
            }
            const unit = measureUnitType === MeasureUnitType.Metric ? 'kg' : 'lb'
            switch (statisticsType) {
                case 'avg': return value.toFixed(1) + " " + unit
                case 'range': return `${value[0].toFixed(1)} - ${value[1].toFixed(1)} ${unit}`
            }

        case DataSourceType.HoursSlept:
            switch (statisticsType) {
                case 'avg': return DateTimeHelper.formatDuration(Math.round(value), true)
                case 'range': return DateTimeHelper.formatDuration(value[0], true) + " - " + DateTimeHelper.formatDuration(value[1], true)
            }

        case DataSourceType.SleepRange:
            const pivot = startOfDay(new Date())
            const actualTime = addSeconds(pivot, Math.round(value))
            return format(actualTime, 'hh:mm a').toLowerCase()
    }
}

function getChartView(sourceType: DataSourceType, data: OverviewSourceRow, query: DataDrivenQuery | undefined, highlightedDays: { [key: number]: boolean | undefined } | undefined): any {

    const commonProps = {
        preferredValueRange: data.preferredValueRange,
        dataDrivenQuery: query,
        highlightedDays: highlightedDays,
        dateRange: data.range,
        data: data.data,
        goalValue: data.goal
    }

    switch (sourceType) {
        case DataSourceType.StepCount:
            return <DailyBarChart
                {...commonProps}
                dataSource={DataSourceType.StepCount}
                valueTickFormat={(tick: number) => { return (tick % 1000 === 0 && tick != 0) ? tick / 1000 + "k" : commaNumber(tick) }} />
        case DataSourceType.HoursSlept:
            return <DailyBarChart
                {...commonProps}
                dataSource={DataSourceType.HoursSlept}
                data={data.data.map((d: any) => ({ numberedDate: d.numberedDate, value: d.lengthInSeconds }))}
                valueTickFormat={(tick: number) => { return DateTimeHelper.formatDuration(tick, true) }}
                valueTicksOverride={(maxValue: number) => {
                    const scale = scaleLinear().domain([0, Math.ceil(maxValue / 3600)]).nice()
                    return {
                        ticks: scale.ticks(5).map(t => t * 3600),
                        newDomain: scale.domain().map(t => t * 3600)
                    }
                }}
            />
        case DataSourceType.HeartRate:
            return <DailyHeartRateChart
                {...commonProps}
                dataSource={DataSourceType.HeartRate}
            />
        case DataSourceType.SleepRange:
            return <DailySleepRangeChart
                {...commonProps}
                dataSource={DataSourceType.SleepRange}
            />
        case DataSourceType.Weight:
            const weightData = data as WeightRangedData
            return <DailyWeightChart
                {...commonProps}
            />
    }
}

export const DataSourceChartFrame = React.memo((props: {
    data: OverviewSourceRow,
    filter: DataDrivenQuery,
    highlightedDays?: { [key: number]: boolean | undefined }
    showToday?: boolean
    flat?: boolean
    showHeader?: boolean
    onHeaderPressed?: (source: DataSourceType) => void
    onTodayPressed?: (source: DataSourceType) => void
}) => {

    const onHeaderPress = useCallback(() => props.onHeaderPressed && props.onHeaderPressed(props.data.source), [props.onHeaderPressed, props.data.source])
    const onTodayPress = useCallback(() => props.onTodayPressed && props.onTodayPressed(props.data.source), [props.onTodayPressed, props.data.source])


    const spec = DataSourceManager.instance.getSpec(props.data.source)

    const measureUnitType = useSelector((appState: ReduxAppState) => appState.settingsState.unit)

    const todayInfo = useMemo(() => formatTodayValue(props.data.source, props.data.today, measureUnitType),
        [props.data.source, props.data.today, measureUnitType])

    return <View style={props.flat === true ? styles.containerStyleFlat : styles.containerStyle}>
        {props.showHeader !== false ?
            <View style={styles.headerStyle}>
                <View style={styles.headerClickRegionWrapperStyle}>
                    <TouchableOpacity onPress={onHeaderPress} disabled={props.onHeaderPressed == null} activeOpacity={0.7} style={styles.headerClickRegionStyle}>
                        <DataSourceIcon style={styles.iconStyle} size={18} type={props.data.source} color={Colors.accent} />
                        <Text style={styles.headerTitleStyle}>{spec.name}</Text>
                    </TouchableOpacity>
                </View>

                {
                    props.showToday !== false && props.data.today != null ?
                        <TouchableOpacity style={styles.todayButtonStyle}
                            onPress={onTodayPress} disabled={props.onTodayPressed == null}><Text style={styles.headerDescriptionTextStyle}>
                                <Text>{todayInfo.label + ": "}</Text>
                                {
                                    todayInfo.formatted != null ? todayInfo.formatted.map((chunk, index) =>
                                        <Text key={index} style={chunk.type === 'unit' ? styles.todayUnitStyle : styles.todayValueStyle}>{chunk.text}</Text>)
                                        :
                                        (<Text style={styles.todayValueStyle}>no value</Text>)
                                }
                            </Text></TouchableOpacity> : <></>
                }
            </View> : null}
        {
            getChartView(spec.type, props.data, props.filter, props.highlightedDays)
        }
        <View style={styles.footerStyle}>{
            props.data.statistics && props.data.statistics.map(stat => {
                return <Text key={stat.type} style={styles.statValueStyle}>
                    <Text style={styles.statLabelStyle}>{getStatisticsLabel(stat.type) + " "}</Text>
                    <Text>{stat.value != null && (typeof stat.value == "number" || (stat.value[0] != null && stat.value[1] != null)) ? formatStatistics(props.data.source, stat.type, measureUnitType, stat.value) : "no value"}</Text>
                </Text>
            })
        }
        </View>
    </View >
})