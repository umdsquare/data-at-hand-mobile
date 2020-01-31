import React, { useState, RefObject } from "react";
import { ChartState } from "../types";
import { PanResponder, PanResponderInstance, PanResponderGestureState, UIManager, findNodeHandle, LayoutRectangle } from "react-native";
import { CommonBrowsingChartStyles } from "./common";
import { G, Rect } from "react-native-svg";
import { ScaleBand } from "d3-scale";
import Colors from "../../../../style/Colors";
import { Dispatch } from "redux";
import { TouchingElementInfo, ParameterType } from "../../../../core/exploration/types";
import { setTouchElementInfo, createGoToBrowseDayAction, InteractionType } from "../../../../state/exploration/interaction/actions";
import { ReduxAppState } from "../../../../state/types";
import { connect } from "react-redux";
import { DataSourceType } from "../../../../measure/DataSourceSpec";
import { explorationInfoHelper } from "../../../../core/exploration/ExplorationInfoHelper";

const CLICK_THRESHOLD_MILLIS = 150

interface Props {
    chartArea: LayoutRectangle,
    children?: any,
    scaleX: ScaleBand<number>,
    dataSource: DataSourceType,
    onDateTouchStart?: (date: number) => void,
    onDateTouchMove?: (date: number) => void,
    onDateTouchEnd?: (date: number) => void,
    onDateClick?: (date: number) => void,

    currentTouchingInfo?: TouchingElementInfo,
    isContainerScrolling?: boolean,
    setTouchingInfo?: (info: TouchingElementInfo) => void,
    goToDayDetail?: (date: number)=>void
}
interface State {
    touchedDate: number,
    touchStartX: number,
    touchStartY: number,
    touchStartedAt: number,
    areaInScreen: LayoutRectangle
}
class GroupWithTouchInteraction extends React.Component<Props, State>{

    private chartAreaResponder: PanResponderInstance

    constructor(props) {
        super(props)

        this.chartAreaResponder = PanResponder.create({
            onPanResponderTerminationRequest: () => false,
            onStartShouldSetPanResponder: (ev, gestureState) => true,
            onMoveShouldSetPanResponder: (ev, gestureState) => true,
            onMoveShouldSetPanResponderCapture: (ev, state) => true,
            onStartShouldSetPanResponderCapture: (ev, state) => true,
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
            touchStartX: null,
            touchStartY: null,
            touchStartedAt: null,
            areaInScreen: null
        }
    }

    componentDidMount(){
        setTimeout(()=>{
        UIManager.measureInWindow(findNodeHandle(this), (x, y, width, height) => {
            this.setState(
                {
                    ...this.state,
                    areaInScreen: {x, y, width, height}
                }
            )
        })
        }, 100)
    }

    componentDidUpdate(prevProps: Props){
        if(prevProps.isContainerScrolling === true && this.props.isContainerScrolling === false){
            UIManager.measureInWindow(findNodeHandle(this), (x, y, width, height) => {
                this.setState(
                    {
                        ...this.state,
                        areaInScreen: {x, y, width, height}
                    }
                )
            })
        }
    }



    onTouchChartArea = (x: number, y: number, type: "start" | "move" | "end", screenX: number, screenY: number, gestureState: PanResponderGestureState) => {
        const localX = CommonBrowsingChartStyles.transformViewXToChartAreaLocalX(x)
        const localY = CommonBrowsingChartStyles.transformViewYToChartAreaLocalY(y)
        const domains = this.props.scaleX.domain()
        let index = Math.max(0, Math.min(domains.length - 1, Math.floor(localX / this.props.scaleX.step())))
        const date = domains[index]

        const touchingInfo = {
            touchId: gestureState.stateID.toString(),
            elementBoundInScreen: { x: this.state.areaInScreen.x + this.props.scaleX(date), y: this.state.areaInScreen.y, width: this.props.scaleX.bandwidth(), height: this.state.areaInScreen.height },
            params: [
                { parameter: ParameterType.DataSource, value: this.props.dataSource },
                { parameter: ParameterType.Date, value: date }
            ]
        } as TouchingElementInfo


        switch (type) {
            case "start":

                this.setState({
                    ...this.state,
                    touchStartX: x,
                    touchStartY: y,
                    touchStartedAt: Date.now(),
                    touchedDate: date
                })
                console.log("touch start")
                setTimeout(() => {
                    if (this.state.touchStartX != null && this.props.isContainerScrolling !== true) {
                        this.props.onDateTouchStart && this.props.onDateTouchStart(date)
                        this.props.setTouchingInfo(touchingInfo)
                    }
                }, CLICK_THRESHOLD_MILLIS + 10)
                break;
            case "move":

                if (this.state.touchedDate !== date) {
                    //date changed
                    this.setState({
                        ...this.state,
                        touchedDate: date
                    })
                    this.props.onDateTouchMove && this.props.onDateTouchMove(date)
                    this.props.setTouchingInfo(touchingInfo)
                }
                break;
            case "end":

                if (this.state.touchStartedAt != null && Date.now() - this.state.touchStartedAt < CLICK_THRESHOLD_MILLIS && gestureState.moveX < 50 && gestureState.moveY < 50) {
                    this.props.onDateClick && this.props.onDateClick(date)
                    this.props.goToDayDetail(date)
                    console.log("click")
                }

                this.setState({
                    ...this.state,
                    touchStartX: null,
                    touchStartY: null,
                    touchStartedAt: null,
                    touchedDate: null
                })
                this.props.onDateTouchEnd && this.props.onDateTouchEnd(date)
                this.props.setTouchingInfo(null)
                break;
        }
    }

    render() {

        let linkedDate: number
        if (this.props.currentTouchingInfo != null) {
            const dataSource = explorationInfoHelper.getParameterValueOfParams(this.props.currentTouchingInfo.params, ParameterType.DataSource)
            const date = explorationInfoHelper.getParameterValueOfParams<number>(this.props.currentTouchingInfo.params, ParameterType.Date)
            if (dataSource === this.props.dataSource && date != null) {
                linkedDate = date
            }
        }

        return <G {...this.props.chartArea} {...this.chartAreaResponder.panHandlers}>
            <Rect x={0} y={0} width={this.props.chartArea.width} height={this.props.chartArea.height} fill="transparent" />
            {
                linkedDate && <Rect fill="#00000010" strokeWidth={1} stroke={Colors.accent} x={this.props.scaleX(linkedDate)} width={this.props.scaleX.bandwidth()} height={this.props.chartArea.height} />
            }
            {this.props.children}
        </G>
    }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: Props): Props {
    return {
        ...ownProps,
        setTouchingInfo: (info) => dispatch(setTouchElementInfo(info)),
        goToDayDetail: (date)=> dispatch(createGoToBrowseDayAction(InteractionType.TouchOnly, ownProps.dataSource, date))
    }
}

function mapStateToProps(appState: ReduxAppState, ownProps: Props): Props {
    return {
        ...ownProps,
        currentTouchingInfo: appState.explorationState.touchingElement,
        isContainerScrolling: appState.explorationState.uiStatus.overviewScrolling
    }
}


const connected = connect(mapStateToProps, mapDispatchToProps)(GroupWithTouchInteraction)
export { connected as GroupWithTouchInteraction }