import React from 'react'
import { connect } from 'react-redux'
import { explorationInfoHelper } from '@core/exploration/ExplorationInfoHelper'
import { TouchingElementInfo, TouchingElementValueType } from '@data-at-hand/core/exploration/TouchingElementInfo'
import { ReduxAppState, ActionTypeBase } from '@state/types'
import { RangeAggregatedComparisonData, IAggregatedRangeValue, IAggregatedValue } from '@core/exploration/data/types'
import { DataSourceType, MeasureUnitType, inferIntraDayDataSourceType } from '@data-at-hand/core/measure/DataSourceSpec'
import { Dispatch } from 'redux'
import { View, StyleSheet, LayoutRectangle, Text } from 'react-native'
import { StyleTemplates } from '@style/Styles'
import SegmentedControl from '@react-native-community/segmented-control';
import { Sizes, sizeByScreen } from '@style/Sizes'
import Colors from '@style/Colors'
import { SizeWatcher } from '@components/visualization/SizeWatcher'
import { RangeValueElementLegend } from '@components/visualization/compare/RangeValueElementLegend'
import { SingleValueElementLegend } from '@components/visualization/compare/SingleValueElementLegend'
import { G, Line, Text as SvgText, Rect } from 'react-native-svg'
import { scaleBand, scaleLinear, ScaleBand } from 'd3-scale'
import commaNumber from 'comma-number';
import { DateTimeHelper } from '@data-at-hand/core/utils/time'
import convertUnit from 'convert-units';
import { timeTickFormat } from '@components/visualization/compare/common'
import { min, max } from 'd3-array'
import { SingleValueElement } from '@components/visualization/compare/SingleValueElement'
import { RangeValueElement } from '@components/visualization/compare/RangeValueElement'
import { createGoToBrowseRangeAction, setTouchElementInfo, shiftAllRanges, createGoToBrowseDayAction } from '@state/exploration/interaction/actions'
import { noop } from '@data-at-hand/core/utils'
import { CategoricalTouchableSvg } from '@components/visualization/CategoricalTouchableSvg'
import { HorizontalPullToActionContainer } from '@components/common/HorizontalPullToActionContainer'
import { getScaleStepLeft } from '@components/visualization/d3-utils'
import { ParameterType } from '@data-at-hand/core/exploration/ExplorationInfo'
import { InteractionType } from '@data-at-hand/core/exploration/actions'
import StyledText from 'react-native-styled-text';

const INDEX_AGGREGATED = 0
const INDEX_SUM = 1
const SEGEMENTED_VALUES = ["Daily Average", "Total"]

const xAxisHeight = 70
const yAxisWidth = 70
const topPadding = 10
const rightPadding = 20

const legendVerticalPadding = sizeByScreen(Sizes.verticalPadding, Sizes.verticalPadding * 0.5)
const segmentControlVerticalMargin = sizeByScreen(Sizes.horizontalPadding, 0)

const styles = StyleSheet.create({
    containerStyle: {
        ...StyleTemplates.fillFlex,
        backgroundColor: Colors.WHITE
    },
    segmentedControlContainer: {
        margin: Sizes.horizontalPadding,
        marginBottom: segmentControlVerticalMargin,
        height: 32
    },

    rangeLegendContainerStyle: { alignItems: 'flex-end', padding: legendVerticalPadding, paddingTop: Sizes.verticalPadding, paddingLeft: Sizes.horizontalPadding * .5, paddingRight: Sizes.horizontalPadding * .5 },
    singleLegendContainerStyle: { alignItems: 'flex-end', padding: legendVerticalPadding, paddingTop: Sizes.verticalPadding, paddingLeft: Sizes.horizontalPadding, paddingRight: Sizes.horizontalPadding },

    chartContainerStyleWithoutLegend: { ...StyleTemplates.fillFlex, marginTop: 20 },

    noItemIndicatorStyle: {
        alignSelf: 'center', color: Colors.textColorLight,
        fontSize: Sizes.normalFontSize,
        margin: Sizes.verticalPadding,
        lineHeight: Sizes.normalFontSize*1.5
    }
})

interface Props {
    data?: RangeAggregatedComparisonData<IAggregatedRangeValue | IAggregatedValue>,
    source?: DataSourceType,
    sumSupported?: boolean,
    allRangesAreSingleDay?: boolean,
    measureUnitType?: MeasureUnitType,
    dispatchExplorationAction?: (explorationAction: ActionTypeBase) => void,


    noDataMessageOverride?: string,
}

interface State {
    aggregationSettingIndex: number,
    chartContainerWidth: number,
    chartContainerHeight: number
}

class MultiRangeComparisonMainPanel extends React.PureComponent<Props, State>{

    constructor(props: Props) {
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

    private onElementClick = (timeKey: number) => {
        const range = this.props.data.data[timeKey].range
        if (range[0] === range[1]) {
            const intradayDataSource = inferIntraDayDataSourceType(this.props.source)
            if (intradayDataSource != null) {
                this.props.dispatchExplorationAction(createGoToBrowseDayAction(InteractionType.TouchOnly, intradayDataSource, range[0]))
                return
            }
        }

        this.props.dispatchExplorationAction(createGoToBrowseRangeAction(InteractionType.TouchOnly, null,
            this.props.data.data[timeKey].range
        ))
    }

    private onElementLongPress = (timeKey: number, x: number, y: number, screenX: number, screenY: number, scaleX: ScaleBand<number>, chartArea: LayoutRectangle, touchId: string) => {

        const dataPoint = this.props.data.data[timeKey]
        const touchingInfo = {
            touchId,
            elementBoundInScreen: {
                x: screenX - x + chartArea.x + getScaleStepLeft(scaleX, timeKey),
                y: screenY - y + chartArea.y,
                width: scaleX.step(),
                height: chartArea.height
            },
            valueType: TouchingElementValueType.RangeAggregated,
            params: [
                { parameter: ParameterType.DataSource, value: this.props.source },
                { parameter: ParameterType.Range, value: dataPoint.range }
            ],
            value: dataPoint.value
        } as TouchingElementInfo



        this.props.dispatchExplorationAction(setTouchElementInfo(touchingInfo))
    }

    private readonly onElementLongPressOut = () => {
        this.props.dispatchExplorationAction(setTouchElementInfo(null))
    }

    private readonly onPulledFromSide = (from: 'left' | 'right') => {
        this.props.dispatchExplorationAction(shiftAllRanges(InteractionType.TouchOnly, from === 'left' ? 'past' : 'future'))
    }


    render() {

        if (this.props.data == null || this.props.data.data.length === 0) {
            return <HorizontalPullToActionContainer
                style={styles.containerStyle}
                onPulled={this.onPulledFromSide}
            ><View style={StyleTemplates.contentVerticalCenteredContainer}>
                    <StyledText style={styles.noItemIndicatorStyle}>{this.props.noDataMessageOverride || "No data"}</StyledText>
                </View></HorizontalPullToActionContainer>
        }

        const aggregationSettingIndex = this.props.sumSupported === true ? (this.props.allRangesAreSingleDay === true ? INDEX_SUM : this.state.aggregationSettingIndex) : INDEX_AGGREGATED

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

        const indices: Array<number> = []
        this.props.data.data.forEach((d, i) => indices.push(i))

        const scaleX = scaleBand<number>().domain(indices).range([0, chartArea.width]).padding(0.55).paddingOuter(0.25)
        const scaleY = scaleLinear().range([chartArea.height, 0])
        const availableData = this.props.data.data.filter(d => d.value != null && d.value.n > 0)
        if (aggregationSettingIndex === INDEX_AGGREGATED) {
            scaleY.domain([startFromZero === true ? 0 : Math.min(min(availableData, (d: any) => {
                if (isRanged === true) {
                    //range
                    return Math.min(valueConverter(d.value["minA"]), valueConverter(d.value["minB"]))
                } else {
                    return valueConverter(d.value["min"])
                }
            }), this.props.data.preferredValueRange ? valueConverter(this.props.data.preferredValueRange[0]) : Number.MAX_VALUE),

            Math.max(max(availableData, (d: any) => {
                if (isRanged === true) {
                    //range
                    return Math.max(valueConverter(d.value["maxA"]), valueConverter(d.value["maxB"]))
                } else {
                    return valueConverter(d.value["max"])
                }
            }), this.props.data.preferredValueRange ? valueConverter(this.props.data.preferredValueRange[1]) : Number.MIN_VALUE)])
        } else if (aggregationSettingIndex === INDEX_SUM) {

            scaleY.domain([0, max(availableData, (d: any) => {
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

        return <HorizontalPullToActionContainer
            style={styles.containerStyle}
            onPulled={this.onPulledFromSide}
        >{
                this.props.sumSupported === true ? <SegmentedControl values={SEGEMENTED_VALUES}
                    selectedIndex={aggregationSettingIndex}
                    style={styles.segmentedControlContainer}
                    enabled={this.props.allRangesAreSingleDay !== true}
                    onValueChange={this.onSegmentedValueChange} /> : null
            }

            {
                aggregationSettingIndex === INDEX_AGGREGATED ? (this.props.source === DataSourceType.SleepRange ?
                    <View style={styles.rangeLegendContainerStyle}>
                        <RangeValueElementLegend rangeALabel="Bedtime Range" rangeBLabel="Wake Time Range" />
                    </View> : <View style={styles.singleLegendContainerStyle}><SingleValueElementLegend /></View>) : null
            }
            <SizeWatcher containerStyle={aggregationSettingIndex === INDEX_AGGREGATED ? StyleTemplates.fillFlex : styles.chartContainerStyleWithoutLegend}
                onSizeChange={(width, height) => {
                    this.setState({
                        ...this.state,
                        chartContainerWidth: width,
                        chartContainerHeight: height
                    })
                }}>
                <CategoricalTouchableSvg
                    chartContainerWidth={this.state.chartContainerWidth}
                    chartContainerHeight={this.state.chartContainerHeight}
                    chartArea={chartArea}
                    scaleX={scaleX}
                    onClickElement={this.onElementClick}
                    onLongPressIn={(timeKey, x, y, sX, sY, touchId) => this.onElementLongPress(timeKey, x, y, sX, sY, scaleX, chartArea, touchId)}
                    onLongPressMove={(timeKey, x, y, sX, sY, touchId) => this.onElementLongPress(timeKey, x, y, sX, sY, scaleX, chartArea, touchId)}
                    onLongPressOut={this.onElementLongPressOut}
                >
                    <G x={chartArea.x} y={chartArea.y + chartArea.height}>
                        <Line x1={0} x2={chartArea.width} y={0} stroke={Colors.textColorDark} strokeWidth={0.5} />
                        {
                            indices.map(rangeIndex => <G
                                key={rangeIndex}
                                y={12}
                                x={scaleX(rangeIndex) + scaleX.bandwidth() * .5}>
                                {DateTimeHelper.formatRange(this.props.data.data[rangeIndex].range).map((chunk, i) =>
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
                            aggregationSettingIndex === INDEX_AGGREGATED ? this.props.data.data.map((d: any, i) => {
                                if (d.value != null && d.value.n > 0) {
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
                                    />
                                } else return null
                            }) : this.props.data.data.map((d: any, i) => {
                                return d.value && d.value.n > 0 ? <Rect
                                    key={i}
                                    x={scaleX(i)}
                                    y={scaleY(valueConverter(d.value["sum"]))}
                                    width={scaleX.bandwidth()}
                                    height={scaleY(valueConverter(0)) - scaleY(valueConverter(d.value["sum"]))}
                                    fill={Colors.chartElementDefault + "aa"}
                                /> : null
                            })
                        }
                    </G>
                </CategoricalTouchableSvg>
            </SizeWatcher>
        </HorizontalPullToActionContainer>
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

    const sumSupported = source === DataSourceType.HoursSlept || source === DataSourceType.StepCount
    const data: RangeAggregatedComparisonData<IAggregatedRangeValue | IAggregatedValue> = appState.explorationDataState.data

    let allRangesAreSingleDay = data.data.find(d => d.range[0] !== d.range[1]) == null

    return {
        ...ownProps,
        source,
        sumSupported,
        data,
        allRangesAreSingleDay,
        measureUnitType: appState.settingsState.unit
    }
}


const connected = connect(mapStateToProps, mapDispatchToProps)(MultiRangeComparisonMainPanel)

export { connected as MultiRangeComparisonMainPanel }