import React from 'react'
import { Animated, View, Text, StyleSheet, TextStyle, LayoutAnimation, Dimensions, LayoutRectangle, Easing, LayoutChangeEvent, Platform } from 'react-native'
import { StyleTemplates } from '@style/Styles'
import { TouchingElementInfo, TouchingElementValueType, ParameterType, ExplorationType, ParameterKey } from '@core/exploration/types'
import { ReduxAppState } from '@state/types'
import { connect } from 'react-redux'
import { explorationInfoHelper } from '@core/exploration/ExplorationInfoHelper'
import { DateTimeHelper, isToday, isYesterday } from '@utils/time'
import { format, startOfDay, differenceInDays } from 'date-fns'
import { Sizes } from '@style/Sizes'
import { DataSourceType, MeasureUnitType } from '@measure/DataSourceSpec'
import commaNumber from 'comma-number';
import unitConvert from 'convert-units'
import { addSeconds } from 'date-fns/esm'
import LinearGradient from 'react-native-linear-gradient'
import Colors from '@style/Colors'
import { CycleDimension, getCycleDimensionSpec } from '@core/exploration/cyclic_time'
import { SpeechInputPanel } from '@components/exploration/SpeechInputPanel';
import { ThunkDispatch } from 'redux-thunk'
import { startSpeechSession, requestStopDictation, makeNewSessionId } from '@state/speech/commands';
import Haptic from 'react-native-haptic-feedback';
import Insets from 'react-native-static-safe-area-insets';
import { ZIndices } from '../zIndices'
import { DataServiceManager } from '@measure/DataServiceManager'
import { SpeechContext, SpeechContextHelper } from '@core/speech/nlp/context'
import { createSetSpeechContextAction } from '@state/speech/actions'

const borderRadius = 8

const tooltipTextStyleBase = {
    color: 'white',
    fontSize: Sizes.smallFontSize,
    fontWeight: '500'
} as TextStyle

const styles = StyleSheet.create({
    tooltipContentContainerStyle: {
        alignItems: 'center',
    },

    tooltipTimeMainLabelStyle: {
        ...tooltipTextStyleBase,
        fontSize: Sizes.smallFontSize,
        fontWeight: 'bold',
        marginBottom: 3
    },

    tooltipTimeSubLabelStyle: {
        ...tooltipTextStyleBase,
        fontSize: Sizes.tinyFontSize,
        opacity: 0.8
    },

    tooltipRangeStyle: {
        ...tooltipTextStyleBase,
        fontSize: Sizes.smallFontSize,
        marginTop: 8
    },

    tooltipValueLabelStyle: {
        ...tooltipTextStyleBase,
        fontSize: Sizes.normalFontSize,
        fontWeight: 'bold',
        marginTop: 8
    },

    tooltipValueLabelTitleStyle: {
        ...tooltipTextStyleBase,
        fontSize: Sizes.smallFontSize,
        fontWeight: '400',
        width: 60
    },

    tooltipValueDigitStyle: {
        fontSize: 20
    },
    tooltipValueUnitStyle: {
        fontSize: Sizes.smallFontSize,
    },

    tooltipStyle: {
        position: 'absolute',
        top: 0,
        left: 0,

        maxWidth: Dimensions.get('window').width * 0.8,

        shadowColor: "black",
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 8,
        shadowOpacity: 0.4,
        minWidth: '50%',
        borderRadius,
        borderColor: "#90909020",
        borderWidth: 1,
        elevation: 10
    },

    valueTableRow: { ...StyleTemplates.flexHorizontalCenteredListContainer, alignItems: "baseline" }
})

const gradientBackgroundProps = {
    style: {
        ...StyleTemplates.fitParent, opacity: 0.85,
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
    },
    colors: Colors.tooltipGradient,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 }
}

interface Props {
    touchingInfo?: TouchingElementInfo,
    measureUnitType?: MeasureUnitType,
    explorationType?: ExplorationType,
    getToday?: () => Date,
    dispatchStartSpeechSession?: (sessionId: string, context: SpeechContext) => void,
    dispatchUpdateSpeechContext?: (sessionId: string, context: SpeechContext) => void,
    dispatchStopDictation?: (sessionId: string) => void,
}

interface State {
    touchingInfo?: TouchingElementInfo,
    speechSessionId?: string,
    tooltipWidth: number,
    tooltipHeight: number,
    tooltipPositionX: number,
    tooltipPositionY: number,
    emergingProgress: Animated.Value,
    tooltipInterpPosition: Animated.ValueXY
}

class TooltipOverlay extends React.PureComponent<Props, State>{

    constructor(props) {
        super(props)

        this.state = {
            touchingInfo: null,
            speechSessionId: null,
            tooltipWidth: 0,
            tooltipHeight: 0,
            tooltipPositionX: 0,
            tooltipPositionY: 0,
            emergingProgress: new Animated.Value(0),
            tooltipInterpPosition: new Animated.ValueXY({ x: 0, y: 0 })
        }
    }

    private onTooltipLayout = (layoutChangeEvent: LayoutChangeEvent) => {
        const { layout } = layoutChangeEvent.nativeEvent
        if (this.state.tooltipWidth != layout.width || this.state.tooltipHeight != layout.height) {

            let { x, y } = this.calculateOptimalTooltipPosition(this.state.touchingInfo.elementBoundInScreen,
                layout.width, layout.height)

            this.setState({
                ...this.state,
                tooltipWidth: layout.width,
                tooltipHeight: layout.height,
                tooltipPositionX: x,
                tooltipPositionY: y
            })

            if (this.state.tooltipWidth === 0 && this.state.tooltipHeight === 0) {
                this.state.tooltipInterpPosition.setValue({ x, y })
            } else {
                Animated.spring(this.state.tooltipInterpPosition, {
                    toValue: { x, y },
                    useNativeDriver: true
                }).start()
            }
        }
    }

    private calculateOptimalTooltipPosition(touchedRectangle: LayoutRectangle, tooltipWidth: number, tooltipHeight: number): { x: number, y: number } {
        let tooltipPositionX, tooltipPositionY

        //In Android, y 0 is below the menu bar. In IOS, y 0 is the actual top of the screen.
        const insetTop = Platform.select({
            ios: Insets.safeAreaInsetsTop,
            android: 0
        })

        const insetBottom = Platform.select({
            ios: Insets.safeAreaInsetsBottom,
            android: 0
        })

        const screenHeight = Dimensions.get("window").height
        const screenWidth = Dimensions.get("window").width
        const upperSpace = touchedRectangle.y - insetTop
        const underSpace = screenHeight - touchedRectangle.y - touchedRectangle.height - insetBottom

        const leftMostTooltipX = Sizes.horizontalPadding
        const rightMostTooltipX = screenWidth - Sizes.horizontalPadding - tooltipWidth

        tooltipPositionX = Math.min(rightMostTooltipX,
            Math.max(leftMostTooltipX,
                (touchedRectangle.x + touchedRectangle.width * .5 - tooltipWidth * .5)))

        //priority: upper
        if (upperSpace - Sizes.verticalPadding * 2 >= tooltipHeight) {
            //place above the touched region
            tooltipPositionY = insetTop + upperSpace - Sizes.verticalPadding - tooltipHeight
        } else if (underSpace - Sizes.verticalPadding * 2 >= tooltipHeight) {
            //place below the touched region
            tooltipPositionY = touchedRectangle.y + touchedRectangle.height + Sizes.verticalPadding
        } else {
            //not enough space => TODO check left and right.
            tooltipPositionY = Sizes.verticalPadding + insetTop
        }
        return { x: tooltipPositionX, y: tooltipPositionY }
    }

    makeSpeechContextFromTouchingInfo(touchingInfo: TouchingElementInfo): SpeechContext {
        let context: SpeechContext
        switch (touchingInfo.valueType) {
            case TouchingElementValueType.CycleDimension:
                {
                    context = SpeechContextHelper.makeCycleDimentionElementSpeechContext(
                        explorationInfoHelper.getParameterValueOfParams<CycleDimension>(
                            touchingInfo.params,
                            ParameterType.CycleDimension),
                        explorationInfoHelper.getParameterValueOfParams<DataSourceType>(
                            touchingInfo.params,
                            ParameterType.DataSource)
                    )
                }
                break;
            case TouchingElementValueType.DayValue:
                {
                    context = SpeechContextHelper.makeDateElementSpeechContext(
                        this.props.explorationType,
                        explorationInfoHelper.getParameterValueOfParams<number>(
                            touchingInfo.params,
                            ParameterType.Date
                        ),
                        explorationInfoHelper.getParameterValueOfParams<DataSourceType>(
                            this.props.touchingInfo.params,
                            ParameterType.DataSource
                        ),
                    )
                }
                break;
            case TouchingElementValueType.RangeAggregated:
                {
                    context = SpeechContextHelper.makeRangeElementSpeechContext(
                        this.props.explorationType,
                        explorationInfoHelper.getParameterValueOfParams<[number, number]>(
                            touchingInfo.params,
                            ParameterType.Range
                        ),
                        explorationInfoHelper.getParameterValueOfParams<DataSourceType>(
                            touchingInfo.params,
                            ParameterType.DataSource
                        ),
                    )
                }
                break;
        }
        return context
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.touchingInfo !== this.props.touchingInfo) {

            if (prevProps.touchingInfo == null) {
                const tooltipPosition = this.calculateOptimalTooltipPosition(this.props.touchingInfo.elementBoundInScreen, this.state.tooltipWidth, this.state.tooltipHeight)

                const speechSessionId = makeNewSessionId()
                this.setState({
                    ...this.state,
                    speechSessionId,
                    touchingInfo: this.props.touchingInfo,
                    tooltipPositionX: tooltipPosition.x,
                    tooltipPositionY: tooltipPosition.y
                })
                this.state.tooltipInterpPosition.setValue(tooltipPosition)

                Animated.spring(this.state.tooltipInterpPosition, {
                    toValue: tooltipPosition,
                    useNativeDriver: true
                }).start()

                Animated.timing(this.state.emergingProgress, {
                    duration: 300,
                    easing: Easing.inOut(Easing.linear),
                    toValue: 1,
                    useNativeDriver: true
                }).start()

                this.props.dispatchStartSpeechSession(speechSessionId, this.makeSpeechContextFromTouchingInfo(this.props.touchingInfo))

                Haptic.trigger("impactHeavy", {
                    enableVibrateFallback: true,
                    ignoreAndroidSystemSettings: true
                })
            } else if (this.props.touchingInfo == null) {

                Animated.timing(this.state.emergingProgress, {
                    duration: 200,
                    easing: Easing.linear,
                    toValue: 0,
                    useNativeDriver: true
                }).start(() => {
                    this.setState({
                        ...this.state,
                        touchingInfo: null
                    })
                })
                if (this.state.speechSessionId) {
                    this.props.dispatchStopDictation(this.state.speechSessionId)
                }

            } else {

                const tooltipPosition = this.calculateOptimalTooltipPosition(this.props.touchingInfo.elementBoundInScreen, this.state.tooltipWidth, this.state.tooltipHeight)

                this.setState({
                    ...this.state,
                    touchingInfo: this.props.touchingInfo,
                    tooltipPositionX: tooltipPosition.x,
                    tooltipPositionY: tooltipPosition.y
                })

                Animated.spring(this.state.tooltipInterpPosition, {
                    toValue: tooltipPosition,
                    useNativeDriver: true
                }).start()

                if (this.state.speechSessionId) {
                    this.props.dispatchUpdateSpeechContext(this.state.speechSessionId,
                        this.makeSpeechContextFromTouchingInfo(this.props.touchingInfo))
                }
            }
        }
    }

    render() {
        return <View pointerEvents="none" style={{ ...StyleTemplates.fitParent, zIndex: ZIndices.TooltipOverlay, elevation: 10 }}>
            <Animated.View
                style={{
                    ...StyleTemplates.fitParent,
                    backgroundColor: "black",
                    opacity: this.state.emergingProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.1]
                    })
                }}
            />
            {this.state.touchingInfo &&
                <Animated.View style={{
                    ...styles.tooltipStyle,
                    transform: [{ translateX: this.state.tooltipInterpPosition.x }, { translateY: this.state.tooltipInterpPosition.y }],
                    opacity: this.state.emergingProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1]
                    }),
                }}

                    onLayout={this.onTooltipLayout}
                >
                    <View
                        style={{ padding: Sizes.verticalPadding }}
                    >
                        <LinearGradient
                            {...gradientBackgroundProps}
                        />
                        {this.makeContentView(this.state.touchingInfo)}
                    </View>
                    <View style={{ backgroundColor: 'white', borderBottomLeftRadius: borderRadius, borderBottomRightRadius: borderRadius }}>
                        <SpeechInputPanel />
                    </View>
                </Animated.View>}
        </View>
    }

    private makeContentView(touchingInfo: TouchingElementInfo): any {
        switch (touchingInfo.valueType) {
            case TouchingElementValueType.DayValue:
                {
                    const date = DateTimeHelper.toDate(explorationInfoHelper.getParameterValueOfParams<number>(touchingInfo.params, ParameterType.Date))
                    const dataSource = explorationInfoHelper.getParameterValueOfParams<DataSourceType>(touchingInfo.params, ParameterType.DataSource)
                    let valueText: string
                    if (touchingInfo.value) {
                        switch (dataSource) {
                            case DataSourceType.StepCount:
                                valueText = `${commaNumber(touchingInfo.value)} steps`
                                break;
                            case DataSourceType.HeartRate:
                                valueText = `${touchingInfo.value} bpm`
                                break;
                            case DataSourceType.HoursSlept:
                                valueText = DateTimeHelper.formatDuration(touchingInfo.value, true)
                                break;
                            case DataSourceType.SleepRange:
                                {
                                    const pivot = startOfDay(Date.now())
                                    const bedTime = addSeconds(pivot, touchingInfo.value.value)
                                    const wakeTime = addSeconds(pivot, touchingInfo.value.value2)

                                    valueText = `${format(bedTime, "hh:mm a")} - ${format(wakeTime, "hh:mm a")}`.toLowerCase()
                                }
                                break;
                            case DataSourceType.Weight:
                                switch (this.props.measureUnitType) {
                                    case MeasureUnitType.Metric:
                                        valueText = `${touchingInfo.value} kg`
                                        break;
                                    case MeasureUnitType.US:
                                        valueText = `${unitConvert(touchingInfo.value).from('kg').to('lb')} lb`
                                        break;
                                }
                                break;
                        }
                    } else {
                        valueText = "No value"
                    }

                    let dayOfWeekLabel = format(date, "EEEE")
                    if (isToday(date, this.props.getToday()) === true) {
                        dayOfWeekLabel += " (Today)"
                    } else if (isYesterday(date, this.props.getToday()) === true) {
                        dayOfWeekLabel += " (Yesterday)"
                    }


                    return <View style={styles.tooltipContentContainerStyle}>
                        <Text style={styles.tooltipTimeMainLabelStyle}>{format(date, "MMM dd, yyyy")}</Text>
                        <Text style={styles.tooltipTimeSubLabelStyle}>{dayOfWeekLabel}</Text>
                        <Text style={styles.tooltipValueLabelStyle}>{valueText}</Text>
                    </View>
                }

            case TouchingElementValueType.CycleDimension:
            case TouchingElementValueType.RangeAggregated:
                {
                    const dataSource = explorationInfoHelper.getParameterValueOfParams<DataSourceType>(touchingInfo.params, ParameterType.DataSource)

                    let valueDef: Array<{ type: "unit" | "digit", text: string }> = null
                    let rangeText: string = null
                    let sumText: string = null
                    if (touchingInfo.value != null && touchingInfo.value.n > 0) {
                        switch (dataSource) {
                            case DataSourceType.StepCount:
                                valueDef = [
                                    { type: "digit", text: commaNumber(Math.round(touchingInfo.value.avg)) },
                                    { type: "unit", text: "steps" }
                                ]
                                rangeText = `${commaNumber(Math.round(touchingInfo.value.min))} - ${commaNumber(Math.round(touchingInfo.value.max))}`
                                sumText = commaNumber(touchingInfo.value.sum)
                                break;
                            case DataSourceType.HeartRate:
                                valueDef = [
                                    { type: 'digit', text: touchingInfo.value.avg.toFixed(1) },
                                    { type: 'unit', text: "bpm" }
                                ]
                                rangeText = `${touchingInfo.value.min} - ${touchingInfo.value.max}`
                                break;
                            case DataSourceType.HoursSlept:
                                valueDef = DateTimeHelper.formatDurationParsed(Math.round(touchingInfo.value.avg), true)
                                rangeText = `${DateTimeHelper.formatDuration(touchingInfo.value.min, true)} - ${DateTimeHelper.formatDuration(touchingInfo.value.max, true)}`
                                sumText = DateTimeHelper.formatDuration(touchingInfo.value.sum, true)
                                break;

                            case DataSourceType.Weight:
                                switch (this.props.measureUnitType) {
                                    case MeasureUnitType.Metric:
                                        valueDef = [{ type: "digit", text: touchingInfo.value.avg.toFixed(1) }, { type: 'unit', text: 'kg' }]
                                        rangeText = `${touchingInfo.value.min.toFixed(1)} - ${touchingInfo.value.max.toFixed(1)}`
                                        break;
                                    case MeasureUnitType.US:
                                        valueDef = [{ type: "digit", text: unitConvert(touchingInfo.value.avg).from('kg').to('lb').toFixed(1) }, { type: 'unit', text: 'lb' }]
                                        rangeText = `${unitConvert(touchingInfo.value.min).from('kg').to('lb').toFixed(1)} - ${unitConvert(touchingInfo.value.max).from('kg').to('lb').toFixed(1)}`
                                        break;
                                }
                                break;

                            case DataSourceType.SleepRange:

                                const pivot = startOfDay(Date.now())
                                const bedTime = addSeconds(pivot, touchingInfo.value.avgA)
                                const wakeTime = addSeconds(pivot, touchingInfo.value.avgB)

                                valueDef = [{ type: "digit", text: format(bedTime, "hh:mm") }, { type: 'unit', text: format(bedTime, "a").toLowerCase() },
                                { type: 'unit', text: '-' },
                                { type: "digit", text: format(wakeTime, "hh:mm") }, { type: 'unit', text: format(wakeTime, "a").toLowerCase() }]
                                break;
                        }
                    }

                    const valueView = valueDef != null ? <View>
                        <View style={styles.valueTableRow}>
                            <Text style={styles.tooltipValueLabelTitleStyle}>Avg:</Text><Text key={"value"} style={styles.tooltipValueLabelStyle}>
                                {
                                    valueDef.map((d, i) => <Text key={i} style={d.type === 'unit' ? styles.tooltipValueUnitStyle : styles.tooltipValueDigitStyle}>{(i > 0 ? " " : "") + d.text}</Text>)
                                }
                            </Text>
                        </View>
                        {
                            rangeText != null ? <View style={styles.valueTableRow}>
                                <Text style={styles.tooltipValueLabelTitleStyle}>Range: </Text>
                                <Text style={styles.tooltipRangeStyle}>
                                    {rangeText}
                                </Text>

                            </View> : <></>
                        }
                        {
                            touchingInfo.valueType === TouchingElementValueType.RangeAggregated && sumText != null ? <View style={styles.valueTableRow}>

                                <Text style={styles.tooltipValueLabelTitleStyle}>Total: </Text>
                                <Text style={{ ...styles.tooltipRangeStyle }}>{sumText}</Text>
                            </View> : <></>
                        }
                    </View> : <Text style={styles.tooltipValueLabelStyle}>No value</Text>

                    if (touchingInfo.valueType === TouchingElementValueType.CycleDimension) {
                        const cycleDimension = explorationInfoHelper.getParameterValueOfParams<CycleDimension>(touchingInfo.params, ParameterType.CycleDimension)
                        var pluralize = require('pluralize')
                        return <View style={styles.tooltipContentContainerStyle}>
                            <Text style={styles.tooltipTimeMainLabelStyle}>{pluralize(getCycleDimensionSpec(cycleDimension).name)}</Text>
                            {valueView}
                            <Text style={{ ...styles.tooltipTimeSubLabelStyle, marginTop: 12 }}>{touchingInfo.value ? touchingInfo.value.n : 0} items</Text>
                        </View>
                    } else if (touchingInfo.valueType === TouchingElementValueType.RangeAggregated) {
                        const range = explorationInfoHelper.getParameterValueOfParams<[number, number]>(touchingInfo.params, ParameterType.Range)
                        const startDate = DateTimeHelper.toDate(range[0])
                        const endDate = DateTimeHelper.toDate(range[1])
                        const numDays = differenceInDays(endDate, startDate) + 1

                        return <View style={styles.tooltipContentContainerStyle}>
                            <Text style={styles.tooltipTimeMainLabelStyle}>{DateTimeHelper.formatRange(range, true)}</Text>
                            {valueView}
                            {<Text style={{ ...styles.tooltipTimeSubLabelStyle, marginTop: 12 }}> {touchingInfo.value ? touchingInfo.value.n : 0} / {numDays} days</Text>}
                        </View>
                    }
                }
        }
    }
}


function mapDispatchToProps(dispatch: ThunkDispatch<{}, {}, any>, ownProps: Props): Props {
    return {
        ...ownProps,
        dispatchStartSpeechSession: (sessionId, context) => dispatch(startSpeechSession(sessionId, context)),
        dispatchStopDictation: (sessionId) => dispatch(requestStopDictation(sessionId)),
        dispatchUpdateSpeechContext: (sessionId, speechContext) => dispatch(createSetSpeechContextAction(speechContext, sessionId))
    }
}

function mapStateToProps(appState: ReduxAppState, ownProps: Props): Props {
    return {
        ...ownProps,
        touchingInfo: appState.explorationState.touchingElement,
        measureUnitType: appState.settingsState.unit,
        explorationType: appState.explorationState.info.type,
        getToday: DataServiceManager.instance.getServiceByKey(appState.settingsState.serviceKey).getToday
    }
}


const connected = connect(mapStateToProps, mapDispatchToProps)(TooltipOverlay)

export { connected as TooltipOverlay }