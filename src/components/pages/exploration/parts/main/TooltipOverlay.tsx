import React from 'react'
import { SafeAreaView, Animated, View, Text, StyleSheet, TextStyle, LayoutAnimation, Dimensions, LayoutRectangle, Easing, LayoutChangeEvent } from 'react-native'
import { StyleTemplates } from '../../../../../style/Styles'
import { TouchingElementInfo, TouchingElementValueType, ParameterType } from '../../../../../core/exploration/types'
import { Dispatch } from 'redux'
import { ReduxAppState } from '../../../../../state/types'
import { connect } from 'react-redux'
import { BlurView } from "@react-native-community/blur";
import { explorationInfoHelper } from '../../../../../core/exploration/ExplorationInfoHelper'
import { DateTimeHelper } from '../../../../../time'
import { format, startOfDay, isToday, isYesterday } from 'date-fns'
import { Sizes } from '../../../../../style/Sizes'
import { DataSourceType, MeasureUnitType } from '../../../../../measure/DataSourceSpec'
import commaNumber from 'comma-number';
import { SizeWatcher } from '../../../../visualization/SizeWatcher'
import unitConvert from 'convert-units'
import { addSeconds } from 'date-fns/esm'
import LinearGradient from 'react-native-linear-gradient'
import Colors from '../../../../../style/Colors'

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

    tooltipValueLabelStyle: {
        ...tooltipTextStyleBase,
        fontSize: Sizes.normalFontSize,
        fontWeight: 'bold',
        marginTop: 8
    },

    tooltipStyle: {
        position: 'absolute',
        top: 0,
        left: 0,


        shadowColor: "black",
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 8,
        shadowOpacity: 0.4,
        minWidth: '50%',
        borderRadius,
        borderColor: "#90909020",
        borderWidth: 1,
    }
})

const gradientBackgroundProps = {
    style: {
        ...StyleTemplates.fitParent, opacity: 0.8,
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
    },
    colors: Colors.tooltipGradient,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 }
}

interface Props {
    touchingInfo?: TouchingElementInfo,
    measureUnitType?: MeasureUnitType
}

interface State {
    touchingInfo?: TouchingElementInfo,
    tooltipWidth: number,
    tooltipHeight: number,
    tooltipPositionX: number,
    tooltipPositionY: number,
    emergingProgress: Animated.Value,
    tooltipInterpPosition: Animated.ValueXY
}

class TooltipOverlay extends React.Component<Props, State>{

    constructor(props) {
        super(props)

        this.state = {
            touchingInfo: null,
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

        const screenHeight = Dimensions.get("window").height
        const screenWidth = Dimensions.get("window").width
        const upperSpace = touchedRectangle.y
        const underSpace = screenHeight - touchedRectangle.y - touchedRectangle.height

        const leftMostTooltipX = Sizes.horizontalPadding
        const rightMostTooltipX = screenWidth - Sizes.horizontalPadding - tooltipWidth

        tooltipPositionX = Math.min(rightMostTooltipX,
            Math.max(leftMostTooltipX,
                (touchedRectangle.x + touchedRectangle.width * .5 - tooltipWidth * .5)))

        //priority: upper
        if (upperSpace - Sizes.verticalPadding * 2 >= tooltipHeight) {
            //place above the touched region
            tooltipPositionY = upperSpace - Sizes.verticalPadding - tooltipHeight
        } else if (underSpace - Sizes.verticalPadding * 2 >= tooltipHeight) {
            //place below the touched region
            tooltipPositionY = touchedRectangle.y + touchedRectangle.height + Sizes.verticalPadding
        } else {
            //not enough space => TODO check left and right.
            throw "TODO: Check left and right"
        }
        return { x: tooltipPositionX, y: tooltipPositionY }
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.touchingInfo !== this.props.touchingInfo) {

            if (prevProps.touchingInfo == null) {
                const tooltipPosition = this.calculateOptimalTooltipPosition(this.props.touchingInfo.elementBoundInScreen, this.state.tooltipWidth, this.state.tooltipHeight)

                this.setState({
                    ...this.state,
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

            }
        }
    }

    render() {
        return <View pointerEvents="none" style={StyleTemplates.fitParent}>
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
                    <View style={{ height: 50, backgroundColor: 'white', borderBottomLeftRadius: borderRadius, borderBottomRightRadius: borderRadius }}>

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
                    if (isToday(date) === true) {
                        dayOfWeekLabel += " (Today)"
                    } else if (isYesterday(date) === true) {
                        dayOfWeekLabel += " (Yesterday)"
                    }


                    return <View style={styles.tooltipContentContainerStyle}>
                        <Text style={styles.tooltipTimeMainLabelStyle}>{format(date, "MMM dd, yyyy")}</Text>
                        <Text style={styles.tooltipTimeSubLabelStyle}>{dayOfWeekLabel}</Text>
                        <Text style={styles.tooltipValueLabelStyle}>{valueText}</Text>

                    </View>
                }
        }
    }
}


function mapDispatchToProps(dispatch: Dispatch, ownProps: Props): Props {
    return {
        ...ownProps,
    }
}

function mapStateToProps(appState: ReduxAppState, ownProps: Props): Props {
    return {
        ...ownProps,
        touchingInfo: appState.explorationState.touchingElement,
        measureUnitType: appState.settingsState.unit
    }
}


const connected = connect(mapStateToProps, mapDispatchToProps)(TooltipOverlay)

export { connected as TooltipOverlay }