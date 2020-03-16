import React from "react";
import { PanResponder, PanResponderInstance, PanResponderGestureState, LayoutRectangle } from "react-native";
import { CommonBrowsingChartStyles } from "./common";
import { G, Rect } from "react-native-svg";
import { ScaleBand } from "d3-scale";
import Colors from "@style/Colors";
import { Dispatch } from "redux";
import { TouchingElementInfo, ParameterType, inferIntraDayDataSourceType, TouchingElementValueType } from "@core/exploration/types";
import { setTouchElementInfo, createGoToBrowseDayAction, InteractionType } from "../../../../state/exploration/interaction/actions";
import { ReduxAppState } from "../../../../state/types";
import { connect } from "react-redux";
import { DataSourceType } from "../../../../measure/DataSourceSpec";
import { explorationInfoHelper } from "@core/exploration/ExplorationInfoHelper";
import { getScaleStepLeft } from '@components/exploration/visualization/d3-utils';

const CLICK_THRESHOLD_MILLIS = 300

interface Props {
    chartArea: LayoutRectangle,
    children?: any,
    scaleX: ScaleBand<number>,
    dataSource: DataSourceType,
    onDateTouchStart?: (date: number) => void,
    onDateTouchMove?: (date: number) => void,
    onDateTouchEnd?: (date: number) => void,
    onDateClick?: (date: number) => void,
    highlightedDays?: {[key:number]: boolean|undefined},
    getValueOfDate: (date: number) => any,
    linkedDate?: number | null,
    isContainerScrolling?: boolean,
    setTouchingInfo?: (info: TouchingElementInfo|null) => void,
    goToDayDetail?: (date: number) => void
}
interface State {
    touchedDate: number | null,
}
class GroupWithTouchInteraction extends React.PureComponent<Props, State>{

    private chartAreaResponder: PanResponderInstance

    private touchStartX: number | null = null
    private touchStartY: number | null = null
    private touchStartedAt: number | null = null

    private longClickTimeoutHandle?: NodeJS.Timeout

    constructor(props: Props) {
        super(props)

        this.chartAreaResponder = PanResponder.create({
            onPanResponderTerminationRequest: () => false,


            // - Does this view want to become responder on the start of a touch?
            onStartShouldSetPanResponder: (ev, gestureState) => true,
            // Should child views be prevented from becoming responder on first touch?
            onStartShouldSetPanResponderCapture: (ev, gestureState) => true,

            onMoveShouldSetPanResponder: (ev, gestureState) => true,
            onMoveShouldSetPanResponderCapture: (ev, state) => true,
            onPanResponderMove: (ev, gestureState) => {
                this.onTouchChartArea(ev.nativeEvent.locationX, ev.nativeEvent.locationY, "move", ev.nativeEvent.pageX, ev.nativeEvent.pageY, gestureState)
            },
            onPanResponderStart: (ev, gestureState) => {
                this.onTouchChartArea(ev.nativeEvent.locationX, ev.nativeEvent.locationY, "start", ev.nativeEvent.pageX, ev.nativeEvent.pageY, gestureState)
            },
            onPanResponderEnd: (ev, gestureState) => {
                this.onTouchChartArea(ev.nativeEvent.locationX, ev.nativeEvent.locationY, "end", ev.nativeEvent.pageX, ev.nativeEvent.pageY, gestureState)
            },
            onPanResponderRelease: (ev, gestureState) => {
                console.log("release")
            },
            onPanResponderReject: (ev, gestureState) => {
                console.log("reject")
            }
        })

        this.state = {
            touchedDate: null,
        }
    }

    componentWillUnmount(){
        if(this.longClickTimeoutHandle){
            clearTimeout(this.longClickTimeoutHandle)
        }
    }

    private makeTouchingInfo(date: number, x: number, y: number, screenX: number, screenY: number, gestureState: PanResponderGestureState) {

        const dX = screenX - x
        const dY = screenY - y


        const touchingInfo = {
            touchId: gestureState.stateID.toString(),
            elementBoundInScreen: { x: dX + this.props.chartArea.x + getScaleStepLeft(this.props.scaleX!, date), y: dY + this.props.chartArea.y, width: this.props.scaleX.step(), height: this.props.chartArea.height },
            params: [
                { parameter: ParameterType.DataSource, value: this.props.dataSource },
                { parameter: ParameterType.Date, value: date }
            ],
            valueType: TouchingElementValueType.DayValue,

        } as TouchingElementInfo

        try {
            touchingInfo.value = this.props.getValueOfDate(date)
        } catch (e) {
            touchingInfo.value = null
        }

        return touchingInfo
    }

    onTouchChartArea = (x: number, y: number, type: "start" | "move" | "end", screenX: number, screenY: number, gestureState: PanResponderGestureState) => {
        const localX = CommonBrowsingChartStyles.transformViewXToChartAreaLocalX(x)

        const domains = this.props.scaleX.domain()
        let index = Math.max(0, Math.min(domains.length - 1, Math.floor(localX / this.props.scaleX.step())))
        const date = domains[index]

        const isTouchPointStable = Math.abs(gestureState.dy) < 5 && Math.abs(gestureState.vy) < 0.1

        switch (type) {
            case "start":

                this.setState({
                    ...this.state,
                    touchedDate: date
                })
                this.touchStartX = x
                this.touchStartY = y
                this.touchStartedAt = Date.now()

                if (this.longClickTimeoutHandle) {
                    clearTimeout(this.longClickTimeoutHandle)
                }
                this.longClickTimeoutHandle = setTimeout(() => {
                    if (this.touchStartX != null && this.props.isContainerScrolling !== true && isTouchPointStable === true) {
                        this.props.onDateTouchStart && this.props.onDateTouchStart(date)
                        this.props.setTouchingInfo!(this.makeTouchingInfo(date, x, y, screenX, screenY, gestureState))
                    }
                }, CLICK_THRESHOLD_MILLIS + 10)
                break;
            case "move":
                if (this.state.touchedDate !== date && this.props.linkedDate != null) {
                    //date changed
                    this.setState({
                        ...this.state,
                        touchedDate: date
                    })
                    this.props.onDateTouchMove && this.props.onDateTouchMove(date)
                    this.props.setTouchingInfo!(this.makeTouchingInfo(date, x, y, screenX, screenY, gestureState))
                }
                break;
            case "end":
                if (this.touchStartedAt != null && Date.now() - this.touchStartedAt < CLICK_THRESHOLD_MILLIS && this.state.touchedDate === date && isTouchPointStable === true) {
                    this.props.onDateClick && this.props.onDateClick(date)
                    try {
                        if (this.props.getValueOfDate(date)) {
                            this.props.goToDayDetail!(date)
                        }
                    } catch (e) {

                    }
                }

                this.setState({
                    ...this.state,
                    touchedDate: null
                })
                this.touchStartX = null
                this.touchStartY = null
                this.touchStartedAt = null

                this.props.onDateTouchEnd && this.props.onDateTouchEnd(date)
                this.props.setTouchingInfo!(null)
                break;
        }
    }

    render() {

        return <G {...this.props.chartArea} {...this.chartAreaResponder.panHandlers}>

            <Rect x={0} y={0} width={this.props.chartArea.width} height={this.props.chartArea.height} fill="transparent" />
            {
                this.state.touchedDate && !this.props.linkedDate && <Rect fill="#00000015" 
                x={getScaleStepLeft(this.props.scaleX, this.state.touchedDate)} 
                width={this.props.scaleX.step()} height={this.props.chartArea.height} />
            }
            {
                this.props.linkedDate && <Rect fill="#00000010" strokeWidth={1} stroke={Colors.accent} x={getScaleStepLeft(this.props.scaleX, this.props.linkedDate)} 
                width={this.props.scaleX.step()} height={this.props.chartArea.height} />
            }
            {
                this.props.highlightedDays && Object.keys(this.props.highlightedDays).map(date => {
                    return <Rect key={date} fill={Colors.highlightElementBackground} opacity={0.2} x={getScaleStepLeft(this.props.scaleX, Number.parseInt(date))} width={this.props.scaleX.step()} height={this.props.chartArea.height} />
                }) 
            }
            {this.props.children}
        </G>
    }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: Props): Props {
    return {
        ...ownProps,
        setTouchingInfo: (info) => dispatch(setTouchElementInfo(info)),
        goToDayDetail: (date) => dispatch(createGoToBrowseDayAction(InteractionType.TouchOnly, inferIntraDayDataSourceType(ownProps.dataSource), date))
    }
}

function mapStateToProps(appState: ReduxAppState, ownProps: Props): Props {


    let linkedDate: number | null = null
    if (appState.explorationState.touchingElement != null) {
        const selectedDataSource = explorationInfoHelper.getParameterValueOfParams<DataSourceType>(appState.explorationState.touchingElement.params, ParameterType.DataSource)
        if (selectedDataSource === ownProps.dataSource) {
            linkedDate = explorationInfoHelper.getParameterValueOfParams<number>(appState.explorationState.touchingElement.params, ParameterType.Date)
        }
    }

    return {
        ...ownProps,
        linkedDate,
        isContainerScrolling: appState.explorationState.uiStatus.overviewScrolling
    }
}


const connected = connect(mapStateToProps, mapDispatchToProps)(GroupWithTouchInteraction)
export { connected as GroupWithTouchInteraction }