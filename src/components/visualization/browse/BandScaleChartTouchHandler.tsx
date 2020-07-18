import React, { useMemo, useCallback } from 'react';
import { LayoutRectangle } from 'react-native';
import { ScaleBand } from 'd3-scale';
import { DataSourceType, inferIntraDayDataSourceType } from '@data-at-hand/core/measure/DataSourceSpec';
import { TouchingElementInfo, TouchingElementValueType } from '@data-at-hand/core/exploration/TouchingElementInfo';
import { CategoricalTouchableSvg } from '../CategoricalTouchableSvg';
import { Rect, G } from 'react-native-svg';
import { getScaleStepLeft } from '../d3-utils';
import Colors from '@style/Colors';
import { useDispatch, useSelector } from 'react-redux';
import { createGoToBrowseDayAction, setTouchElementInfo } from '@state/exploration/interaction/actions';
import { ReduxAppState } from '@state/types';
import { explorationInfoHelper } from '@core/exploration/ExplorationInfoHelper';
import { ParameterType } from '@data-at-hand/core/exploration/ExplorationInfo';
import { InteractionType } from '@data-at-hand/core/exploration/actions';

export const BandScaleChartTouchHandler = (props: {
    chartContainerWidth: number,
    chartContainerHeight: number,
    chartArea: LayoutRectangle,
    children?: any,
    scaleX: ScaleBand<number>,
    dataSource: DataSourceType,
    highlightedDays?: { [key: number]: boolean | undefined },
    disableIntraDayLink?: boolean,
    getValueOfDate: (date: number) => any,
}) => {

    const dispatch = useDispatch()

    const { selectedDataSource, selectedDate } = useSelector((appState: ReduxAppState) => {
        if (appState.explorationState.touchingElement != null) {
            return {
                selectedDataSource: explorationInfoHelper.getParameterValueOfParams<DataSourceType>(appState.explorationState.touchingElement.params, ParameterType.DataSource),
                selectedDate: explorationInfoHelper.getParameterValueOfParams<number>(appState.explorationState.touchingElement.params, ParameterType.Date)
            }
        } else return {}
    })

    const linkedDate = useMemo(() => {
        if (selectedDataSource === props.dataSource) {
            return selectedDate
        }
    }, [selectedDataSource, selectedDate])


    const setTouchingInfo = useMemo(() => (touchingInfo: TouchingElementInfo) => dispatch(setTouchElementInfo(touchingInfo)), [])
    const goToDayDetail = useMemo(() => (date: number) => dispatch(createGoToBrowseDayAction(
        InteractionType.TouchOnly,
        inferIntraDayDataSourceType(props.dataSource), date)),
        [props.dataSource])


    const onUpdateTouchingInfo = useCallback((date: number, x: number, y: number, screenX: number, screenY: number, touchId: string) => {
        const dX = screenX - x
        const dY = screenY - y

        const touchingInfo = {
            touchId,
            elementBoundInScreen: { x: dX + props.chartArea.x + getScaleStepLeft(props.scaleX!, date), y: dY + props.chartArea.y, width: props.scaleX.step(), height: props.chartArea.height },
            params: [
                { parameter: ParameterType.DataSource, value: props.dataSource },
                { parameter: ParameterType.Date, value: date }
            ],
            valueType: TouchingElementValueType.DayValue,

        } as TouchingElementInfo

        try {
            touchingInfo.value = props.getValueOfDate(date)
        } catch (e) {
            touchingInfo.value = null
        }

        setTouchingInfo(touchingInfo)
    }, [props.chartArea, props.dataSource, props.scaleX, props.getValueOfDate, setTouchingInfo])

    const onTouchOut = useCallback(() => setTouchingInfo(null), [setTouchingInfo])

    const onClickDate = useCallback((date: number) => {
        if (props.getValueOfDate(date) && props.disableIntraDayLink !== true) {
            goToDayDetail(date)
        }
    }, [props.getValueOfDate, props.disableIntraDayLink, goToDayDetail])

    return <CategoricalTouchableSvg
        chartContainerWidth={props.chartContainerWidth}
        chartContainerHeight={props.chartContainerHeight}
        chartArea={props.chartArea}
        scaleX={props.scaleX}
        onLongPressIn={onUpdateTouchingInfo}
        onLongPressMove={onUpdateTouchingInfo}
        onLongPressOut={onTouchOut}
        onClickElement={onClickDate}
    >
        <G {...props.chartArea}>
            {
                linkedDate && <Rect fill="#00000010" strokeWidth={1} stroke={Colors.accent} x={getScaleStepLeft(props.scaleX, linkedDate)}
                    width={props.scaleX.step()} height={props.chartArea.height} />
            }
            {
                props.highlightedDays != null ? Object.keys(props.highlightedDays).map(date => {
                    if (date != null && date != "null") {
                        return <Rect key={date} fill={Colors.highlightElementBackground} opacity={0.2} x={getScaleStepLeft(props.scaleX, Number.parseInt(date))} width={Math.max(3, props.scaleX.step())} height={props.chartArea.height} />
                    } else return null
                }) : null
            }
        </G>
        {props.children}
    </CategoricalTouchableSvg>
}