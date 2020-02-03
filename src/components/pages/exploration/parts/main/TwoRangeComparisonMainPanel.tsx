import React from 'react'
import { connect } from 'react-redux'
import { explorationInfoHelper } from '../../../../../core/exploration/ExplorationInfoHelper'
import { ParameterType } from '../../../../../core/exploration/types'
import { ReduxAppState } from '../../../../../state/types'
import { RangeAggregatedComparisonData, IAggregatedRangeValue, IAggregatedValue } from '../../../../../core/exploration/data/types'
import { DataSourceType, MeasureUnitType } from '../../../../../measure/DataSourceSpec'
import { Dispatch } from 'redux'
import { View, StyleSheet, Text, Platform, LayoutRectangle } from 'react-native'
import { StyleTemplates } from '../../../../../style/Styles'
import SegmentedControlIOS from '@react-native-community/segmented-control';
import { Sizes } from '../../../../../style/Sizes'
import { ButtonGroup } from 'react-native-elements'
import Colors from '../../../../../style/Colors'
import { SizeWatcher } from '../../../../visualization/SizeWatcher'
import { RangeValueElementLegend } from '../../../../exploration/visualization/compare/RangeValueElementLegend'
import { SingleValueElementLegend } from '../../../../exploration/visualization/compare/SingleValueElementLegend'
import Svg, { G, Line, Text as SvgText, Rect, TSpan } from 'react-native-svg'
import { scaleBand, scaleLinear } from 'd3-scale'
import commaNumber from 'comma-number';
import { DateTimeHelper } from '../../../../../time'
import convertUnit from 'convert-units';
import { timeTickFormat } from '../../../../exploration/visualization/compare/common'
import { min, max } from 'd3-array'
import { SingleValueElement } from '../../../../exploration/visualization/compare/SingleValueElement'
import { RangeValueElement } from '../../../../exploration/visualization/compare/RangeValueElement'
import { startOfYear, isSameYear, getDayOfYear, isSameMonth, startOfMonth, endOfMonth, format } from 'date-fns'
import { ExplorationAction, createGoToBrowseRangeAction, InteractionType } from '../../../../../state/exploration/interaction/actions'

const INDEX_AGGREGATED = 0
const INDEX_SUM = 1
const SEGEMENTED_VALUES = ["Daily Average", "Total"]

const noop = (a) => a

const xAxisHeight = 100
const yAxisWidth = 70
const topPadding = 10
const rightPadding = 20

function formatRange(range: [number, number]): string[] {
    const startDate = DateTimeHelper.toDate(range[0])
    const endDate = DateTimeHelper.toDate(range[1])

    if (isSameYear(startDate, endDate) && DateTimeHelper.getMonth(range[0]) === 1 && DateTimeHelper.getDayOfMonth(range[0]) === 1 && DateTimeHelper.getMonth(range[1]) === 12 && DateTimeHelper.getDayOfMonth(range[1]) === 31) {
        //yaer
        return [DateTimeHelper.getYear(range[0]).toString()]
    } else if (isSameMonth(startDate, endDate) && DateTimeHelper.toNumberedDateFromDate(startOfMonth(startDate)) === range[0] && DateTimeHelper.toNumberedDateFromDate(endOfMonth(endDate)) === range[1]) {
        return [format(startDate, "MMMM yyyy")]
    } else return [format(startDate, "MMM dd, yyyy -"), format(endDate, "MMM dd, yyyy")]
}

const styles = StyleSheet.create({
    containerStyle: {
        ...StyleTemplates.fillFlex,
        backgroundColor: 'white'
    },
    segmentedControlContainer: {
        margin: Sizes.horizontalPadding,
        height: 32
    },

    androidButtonGroupWrapperStyle: { margin: Sizes.horizontalPadding * 0.5 },
    androidButtonGroupContainerStyle: { borderRadius: 8 },
    androidButtonGroupTextStyle: {
        fontSize: Sizes.smallFontSize,
    },
    androidButtonGroupSelectedButtonStyle: { backgroundColor: "white" },
    androidButtonGroupSelectedTextStyle: { color: Colors.textColorDark, fontWeight: '700' },
    androidButtonGroupButtonStyle: { backgroundColor: "#76768025" },

    rangeLegendContainerStyle: { alignItems: 'flex-end', padding: Sizes.horizontalPadding, paddingLeft: 0, paddingRight: 0 },
    singleLegendContainerStyle: { alignItems: 'flex-end', padding: Sizes.horizontalPadding },

    chartContainerStyleWithoutLegend: { ...StyleTemplates.fillFlex, marginTop: 20 }
})

interface Props {
    data?: RangeAggregatedComparisonData<IAggregatedRangeValue | IAggregatedValue>,
    source?: DataSourceType,
    sumSupported?: boolean,
    measureUnitType?: MeasureUnitType,
    dispatchExplorationAction?: (ExplorationAction) => void
}

interface State {
    aggregationSettingIndex: number,
    chartContainerWidth: number,
    chartContainerHeight: number
}

class TwoRangeComparisonMainPanel extends React.Component<Props, State>{

    constructor(props) {
        super(props)

        this.state = {
            aggregationSettingIndex: INDEX_AGGREGATED,
            chartContainerWidth: 0,
            chartContainerHeight: 0
        }
    }

    private onSegmentedValueChange = (value: string) => {
        this.setState({
            ...this.state,
            aggregationSettingIndex: SEGEMENTED_VALUES.indexOf(value)
        })
    }

    private onButtonGroupIndexChange = (index: number) => {
        this.setState({
            ...this.state,
            aggregationSettingIndex: index
        })
    }

    private onElementClick = (timeKey: number) => {
        this.props.dispatchExplorationAction(createGoToBrowseRangeAction(InteractionType.TouchOnly, null, 
            this.props.data.data[timeKey].range
            ))
    }

    private onElementLongPressIn = (timeKey: number) => {
        //TODO show tooltip
    }

    private onElementLongPressOut = (timeKey: number) => {
        //TODO hide tooltip
    }


    render() {
        const aggregationSettingIndex = this.props.sumSupported === true ? this.state.aggregationSettingIndex : INDEX_AGGREGATED

        let isRanged = false
        let startFromZero = true
        let yTickFormat = noop
        let valueConverter = noop
        switch (this.props.source) {
            case DataSourceType.StepCount:
                yTickFormat = commaNumber
                break;
            case DataSourceType.HeartRate:
                startFromZero = false
                break;
            case DataSourceType.SleepRange:
                startFromZero = false
                isRanged = true
                yTickFormat = timeTickFormat
                break;
            case DataSourceType.HoursSlept:
                yTickFormat = v => DateTimeHelper.formatDuration(v, true)
                break;
            case DataSourceType.Weight:
                startFromZero = false
                valueConverter = (value) => {
                    switch (this.props.measureUnitType) {
                        case MeasureUnitType.Metric:
                            return value;
                        case MeasureUnitType.US:
                            return convertUnit(value).from('kg').to('lb')
                    }
                }
                break;
        }

        const chartArea: LayoutRectangle = {
            x: yAxisWidth,
            y: topPadding,
            width: this.state.chartContainerWidth - yAxisWidth - rightPadding,
            height: this.state.chartContainerHeight - xAxisHeight - topPadding
        }

        const indices = []
        this.props.data.data.forEach((d, i) => indices.push(i))

        const scaleX = scaleBand<number>().domain(indices).range([0, chartArea.width]).padding(0.55).paddingOuter(0.25)

        const scaleY = scaleLinear().range([chartArea.height, 0])
        if (aggregationSettingIndex === INDEX_AGGREGATED) {
            scaleY.domain([startFromZero === true ? 0 : min(this.props.data.data, d => {
                if (isRanged === true) {
                    //range
                    return Math.min(valueConverter(d.value["minA"]), valueConverter(d.value["minB"]))
                } else {
                    return valueConverter(d.value["min"])
                }
            }), max(this.props.data.data, d => {
                if (isRanged === true) {
                    //range
                    return Math.max(valueConverter(d.value["maxA"]), valueConverter(d.value["maxB"]))
                } else {
                    return valueConverter(d.value["max"])
                }
            })])
        } else if (aggregationSettingIndex === INDEX_SUM) {

            scaleY.domain([0, max(this.props.data.data, d => {
                if (isRanged === true) {
                    //range
                    return Math.max(valueConverter(d.value["sumA"]), valueConverter(d.value["sumB"]))
                } else {
                    return valueConverter(d.value["sum"])
                }
            })])
        }

        scaleY.nice()

        let ticks = scaleY.ticks()
        if (this.props.source === DataSourceType.SleepRange) {
            const scale = scaleLinear().domain([scaleY.domain()[0] / 3600, scaleY.domain()[1] / 3600]).nice()
            scaleY.range([0, chartArea.height]).domain([scale.domain()[0] * 3600, scale.domain()[1] * 3600])
            ticks = scale.ticks().map(t => t * 3600)
        }

        return <View style={styles.containerStyle}>
            {
                this.props.sumSupported === true ? (Platform.OS === 'ios' ?
                    <SegmentedControlIOS values={SEGEMENTED_VALUES}
                        selectedIndex={this.state.aggregationSettingIndex}
                        style={styles.segmentedControlContainer}
                        onValueChange={this.onSegmentedValueChange} /> :
                    <View style={styles.androidButtonGroupWrapperStyle}><ButtonGroup
                        buttons={SEGEMENTED_VALUES}
                        textStyle={styles.androidButtonGroupTextStyle}
                        containerStyle={styles.androidButtonGroupContainerStyle}
                        selectedButtonStyle={styles.androidButtonGroupSelectedButtonStyle}
                        selectedTextStyle={styles.androidButtonGroupSelectedTextStyle}
                        buttonStyle={styles.androidButtonGroupButtonStyle}
                        selectedIndex={this.state.aggregationSettingIndex}

                        onPress={this.onButtonGroupIndexChange}
                    /></View>) : null
            }

            {
                aggregationSettingIndex === INDEX_AGGREGATED ? (this.props.source === DataSourceType.SleepRange ?
                    <View style={styles.rangeLegendContainerStyle}>
                        <RangeValueElementLegend rangeALabel="Bedtime Range" rangeBLabel="Wake Time Range" />
                    </View> : <View style={styles.singleLegendContainerStyle}><SingleValueElementLegend /></View>) : null
            }

            <SizeWatcher containerStyle={aggregationSettingIndex === INDEX_AGGREGATED ? StyleTemplates.fillFlex : styles.chartContainerStyleWithoutLegend} onSizeChange={(width, height) => {
                this.setState({
                    ...this.state,
                    chartContainerWidth: width,
                    chartContainerHeight: height
                })
            }}>

                <Svg width={this.state.chartContainerWidth} height={this.state.chartContainerHeight}>
                    <G x={chartArea.x} y={chartArea.y + chartArea.height}>
                        <Line x1={0} x2={chartArea.width} y={0} stroke={Colors.textColorDark} strokeWidth={0.5} />
                        {
                            indices.map(rangeIndex => <G
                                key={rangeIndex}
                                y={12}
                                x={scaleX(rangeIndex) + scaleX.bandwidth() * .5}>
                                {formatRange(this.props.data.data[rangeIndex].range).map((chunk, i) =>
                                    <SvgText
                                        key={i}
                                        textAnchor={"middle"}
                                        alignmentBaseline="hanging"
                                        fontSize={Sizes.smallFontSize}
                                        fill={Colors.textColorLight}
                                        y={i * (Sizes.smallFontSize * 1.5)}
                                    >{chunk}</SvgText>)}
                            </G>)
                        }
                    </G>

                    <G x={chartArea.x} y={chartArea.y}>
                        {
                            ticks.map(tick => {
                                return <G key={tick} x={0} y={scaleY(tick)}>
                                    <SvgText textAnchor="end"
                                        fill={Colors.chartElementDefault} alignmentBaseline="central" x={-8}>{yTickFormat(tick)}</SvgText>
                                    <Line x1={0} x2={chartArea.width} y={0} stroke={Colors.chartAxisLightColor} /></G>
                            })
                        }
                    </G>
                    <G x={chartArea.x} y={chartArea.y}>
                        {
                            aggregationSettingIndex === INDEX_AGGREGATED ? this.props.data.data.map((d, i) => {
                                if (isRanged === true) {
                                    return <RangeValueElement key={i}
                                        value={{
                                            ...d.value,
                                            timeKey: i,
                                            avgA: valueConverter(d.value["avgA"]),
                                            avgB: valueConverter(d.value["avgB"]),
                                            minA: valueConverter(d.value["minA"]),
                                            minB: valueConverter(d.value["minB"]),
                                            maxA: valueConverter(d.value["maxA"]),
                                            maxB: valueConverter(d.value["maxB"]),
                                        }}
                                        scaleX={scaleX} scaleY={scaleY}
                                        onClick={this.onElementClick}
                                        onLongPressIn={this.onElementLongPressIn}
                                        onLongPressOut={this.onElementLongPressOut}
                                    />
                                } else return <SingleValueElement key={i}
                                    value={{
                                        ...d.value,
                                        timeKey: i,
                                        avg: valueConverter(d.value["avg"]),
                                        max: valueConverter(d.value["max"]),
                                        min: valueConverter(d.value["min"]),
                                        sum: valueConverter(d.value["sum"])
                                    }}
                                    scaleX={scaleX} scaleY={scaleY} maxWidth={40}
                                    
                                    onClick={this.onElementClick}
                                    onLongPressIn={this.onElementLongPressIn}
                                    onLongPressOut={this.onElementLongPressOut}
                                    
                                    />
                            }) : this.props.data.data.map((d, i) => {
                                return <Rect
                                    key={i}
                                    x={scaleX(i)}
                                    y={scaleY(valueConverter(d.value["sum"]))}
                                    width={scaleX.bandwidth()}
                                    height={scaleY(valueConverter(0)) - scaleY(valueConverter(d.value["sum"]))}
                                    fill={Colors.chartElementDefault + "aa"}
                                />
                            })
                        }
                    </G>
                </Svg>

            </SizeWatcher>
        </View>
    }
}


function mapDispatchToProps(dispatch: Dispatch, ownProps: Props): Props {
    return {
        ...ownProps,
        dispatchExplorationAction: (action) => dispatch(action)
    }
}

function mapStateToProps(appState: ReduxAppState, ownProps: Props): Props {
    const source = explorationInfoHelper.getParameterValue<DataSourceType>(appState.explorationDataState.info, ParameterType.DataSource)

    return {
        ...ownProps,
        source,
        sumSupported: source === DataSourceType.HoursSlept || source === DataSourceType.StepCount,
        data: appState.explorationDataState.data,
        measureUnitType: appState.settingsState.unit
    }
}


const connected = connect(mapStateToProps, mapDispatchToProps)(TwoRangeComparisonMainPanel)

export { connected as TwoRangeComparisonMainPanel }