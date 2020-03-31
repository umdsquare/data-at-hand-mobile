import React, { useState, useRef, useCallback, useMemo, useEffect, useImperativeHandle } from "react";
import { View, StyleSheet, Text, ViewStyle, TextStyle, Animated } from "react-native";
import Colors from "@style/Colors";
import { SpeechAffordanceIndicator } from "./SpeechAffordanceIndicator";
import { Sizes } from "@style/Sizes";
import Dash from 'react-native-dash';
import { format, differenceInCalendarDays, addDays, startOfMonth, endOfMonth, addMonths, getYear } from "date-fns";
import { DatePicker, WeekPicker, MonthPicker } from "@components/common/CalendarPickers";
import { DateTimeHelper, isToday, isYesterday } from "@data-at-hand/core/utils/time";
import { SwipedFeedback } from "@components/common/SwipedFeedback";
import { BottomSheet } from "@components/common/BottomSheet";
import Haptic from "react-native-haptic-feedback";
import { useSelector, shallowEqual } from "react-redux";
import { ReduxAppState } from "@state/types";
import { DataServiceManager } from "@measure/DataServiceManager";
import { BorderlessButton, LongPressGestureHandler, State as GestureState, LongPressGestureHandlerStateChangeEvent, FlingGestureHandler, Directions, FlingGestureHandlerStateChangeEvent } from "react-native-gesture-handler";
import { denialAnimationSettings } from "@components/common/Animations";
import { WheelPicker } from "react-native-wheel-picker-android";
import { StyleTemplates } from "@style/Styles";
import { getNumberSequence } from "@data-at-hand/core/utils";
import { Button } from "react-native-elements";
import { InteractionType } from "@data-at-hand/core/exploration/actions";

const dateButtonWidth = 140
const barHeight = 60

const dateButtonSubTextStyle = {
    marginTop: 2,
    fontSize: Sizes.tinyFontSize,
    color: '#B8BAC0',
}

const conatinerStyleBase = {
    alignSelf: 'stretch',
    backgroundColor: "#00000025",
    height: barHeight,
    flexDirection: 'row',
    justifyContent: 'center'
} as ViewStyle

const dateButtonDateTextStyleBase = {
    fontSize: Sizes.normalFontSize,
    color: Colors.WHITE,
    fontWeight: '600',
    marginRight: 4,
} as TextStyle


const styles = StyleSheet.create({
    containerStyle: conatinerStyleBase,

    conatainerWithBorder: {
        ...conatinerStyleBase,
        borderBottomColor: '#ffffff30',
        borderBottomWidth: 1
    },

    dateButtonContainerStyle: {
        height: barHeight,
        justifyContent: 'center',
        alignItems: 'center',
        width: dateButtonWidth
    },
    dateButtonContainerStyleFreeWidth: {
        height: barHeight,
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: Sizes.horizontalPadding,
        paddingLeft: Sizes.horizontalPadding
    },
    dateButtonDatePartStyle: {
        flexDirection: 'row'
    },
    dateButtonDateTextStyle: dateButtonDateTextStyleBase,
    dateButtonDateTextStyleLight: {
        ...dateButtonDateTextStyleBase,
        color: Colors.textColorLight,
        fontWeight: '500'
    },

    midViewDescriptionTextStyle: {
        ...dateButtonSubTextStyle,
        marginBottom: 2
    },

    dateButtonIndicatorContainerStyle: {
        position: 'absolute', right: -5, top: -2
    },

    midViewContainerStyle: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },

    dashViewStyle: {
        alignSelf: 'stretch',
        marginTop: -Sizes.normalFontSize

    },

    dashLineStyle: {
        borderRadius: 100, overflow: 'hidden'
    },

    midViewFooterContainerStyle: {
        position: 'absolute',
        bottom: 10
    },

    periodButtonStyle: {
        backgroundColor: Colors.speechAffordanceColorText,
        borderRadius: 100,
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 2,
        paddingBottom: 2
    },

    periodButtonTitleStyle: {
        fontSize: Sizes.tinyFontSize,
        color: Colors.headerBackgroundDarker,
        fontWeight: 'bold'
    },

    yearPopupButtonStyle: { alignSelf: 'flex-end', marginRight: Sizes.horizontalPadding }
})

type ElementType = 'from' | 'to' | 'period'

interface Props {
    from: number,
    to: number,
    onRangeChanged?: (from: number, to: number, interactionType?: InteractionType) => void,
    onLongPressIn?: (position: ElementType) => void,
    onLongPressOut?: (porition: ElementType) => void,
    showBorder?: boolean,
    isLightMode?: boolean,
    showSpeechIndicator?: boolean
}

interface State {
    from: number,
    to: number,
    fromDate: Date,
    toDate: Date,
    semanticPeriodCaptured: boolean,
    numDays: number,
    level?: "day" | "week" | "month" | "year",
    periodName?: string,
    clickedElementType?: ElementType | null,
}


export class DateRangeBar extends React.PureComponent<Props, State> {

    static deriveState(from: number, to: number, prevState: State): State {

        if (to < from) {
            const fromTemp = from
            from = to
            to = fromTemp
        }

        const fromDate = DateTimeHelper.toDate(from)
        const toDate = DateTimeHelper.toDate(to)
        const numDays = -differenceInCalendarDays(fromDate, toDate) + 1

        const semanticTest = DateTimeHelper.rangeSemantic(fromDate, toDate);

        const newState = {
            ...prevState,
            from,
            to,
            fromDate,
            toDate,
            semanticPeriodCaptured: false,
            numDays: numDays,
            level: "day",
            periodName: undefined
        } as State

        if (semanticTest) {
            switch (semanticTest.semantic) {
                case 'month':
                    newState.semanticPeriodCaptured = true
                    newState.level = 'month'
                    newState.periodName = format(fromDate, "MMM yyyy")
                    break;
                case 'mondayWeek':
                case 'sundayWeek':
                    newState.semanticPeriodCaptured = true
                    newState.level = 'week'
                    newState.periodName = "Week of " + format(fromDate, "MMM d")
                    break;
                case 'year':
                    newState.semanticPeriodCaptured = true
                    newState.level = 'year'
                    newState.periodName = format(fromDate, 'yyyy')
                    break;
            }
        }

        return newState
    }

    static getDerivedStateFromProps(nextProps: Props, currentState: State): State | null {
        if (currentState.from !== nextProps.from ||
            currentState.to !== nextProps.to) {
            return DateRangeBar.deriveState(nextProps.from, nextProps.to, currentState)
        }
        return null
    }

    private swipedFeedbackRef = React.createRef<SwipedFeedback>()
    private bottomSheetRef = React.createRef<BottomSheet>()

    private toButtonRef = React.createRef<DateButtonApi>()
    private fromButtonRef = React.createRef<DateButtonApi>()

    constructor(props: Props) {
        super(props)
        this.state = DateRangeBar.deriveState(props.from, props.to, { isBottomSheetOpen: false, } as any)
    }

    private onClickedElement(type: ElementType) {
        this.setState({
            ...this.state,
            clickedElementType: type,
        })
        this.bottomSheetRef.current?.open()
    }

    private readonly onFromDatePressed = () => {
        this.onClickedElement('from')
    }

    private readonly onToDatePressed = () => {
        this.onClickedElement('to')
    }

    private readonly onPeriodPressed = () => {
        this.onClickedElement('period')
    }

    private readonly handleSwipe = (direction: 'left' | 'right') => {
        const sign = direction === 'left' ? 1 : -1

        const shiftedRange = DateTimeHelper.pageRange(this.state.fromDate, this.state.toDate, sign)

        this.setRange(shiftedRange[0], shiftedRange[1], InteractionType.TouchOnly)
        this.swipedFeedbackRef.current?.startFeedback(direction)
    }

    private readonly onSwipeLeft = (ev: FlingGestureHandlerStateChangeEvent) => {
        if (ev.nativeEvent.state === GestureState.ACTIVE) {
            this.handleSwipe('left')
        }
    }

    private readonly onSwipeRight = (ev: FlingGestureHandlerStateChangeEvent) => {
        if (ev.nativeEvent.state === GestureState.ACTIVE) {
            this.handleSwipe('right')
        }
    }

    private readonly setRange = (from: number, to: number, interactionType: InteractionType = InteractionType.TouchOnly) => {

        const newState = DateRangeBar.deriveState(
            from,
            to,
            { ...this.state, clickedElementType: null }
        )

        this.setState(newState)

        this.bottomSheetRef.current?.close()

        if (this.props.onRangeChanged) {
            this.props.onRangeChanged!(newState.from, newState.to, interactionType)
        }
    }

    private readonly setFromDate = (from: Date, interactionType: InteractionType = InteractionType.TouchOnly) => {
        this.setRange(DateTimeHelper.toNumberedDateFromDate(from), this.state.to, interactionType)
    }

    private readonly setToDate = (to: Date, interactionType: InteractionType = InteractionType.TouchOnly) => {
        this.setRange(
            this.state.from, DateTimeHelper.toNumberedDateFromDate(to), interactionType)
    }

    private readonly setMonth = (monthDate: Date, interactionType: InteractionType) => {
        this.setRange(DateTimeHelper.toNumberedDateFromDate(startOfMonth(monthDate)),
            DateTimeHelper.toNumberedDateFromDate(endOfMonth(monthDate)), interactionType)
    }

    private readonly setMonthByCalendar = (monthDate: Date) => {
        this.setMonth(monthDate, InteractionType.TouchOnly)
    }

    private readonly onYearSelected = (year: number) => {
        this.setRange(DateTimeHelper.toNumberedDateFromValues(year, 1,1), DateTimeHelper.toNumberedDateFromValues(year, 12, 31), InteractionType.TouchOnly)
    }

    private readonly onWeekSelected = (start: Date, end: Date) => {
        this.setRange(DateTimeHelper.toNumberedDateFromDate(start), DateTimeHelper.toNumberedDateFromDate(end), InteractionType.TouchOnly)
    }

    private readonly onFromButtonLongPressIn = () => {
        Haptic.trigger("impactHeavy", {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: true
        })

        if (this.props.onLongPressIn) {
            this.props.onLongPressIn('from')
        } else {
            requestAnimationFrame(() => {
                this.fromButtonRef.current?.playDenialAnimation()
            })
        }

    }

    private readonly onFromButtonLongPressOut = () => {
        this.props.onLongPressOut && this.props.onLongPressOut('from')
    }


    private readonly onToButtonLongPressIn = () => {
        Haptic.trigger("impactHeavy", {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: true
        })

        if (this.props.onLongPressIn != null) {
            this.props.onLongPressIn('to')
        } else {

            this.toButtonRef.current?.playDenialAnimation()
        }
    }

    private readonly onToButtonLongPressOut = () => {
        this.props.onLongPressOut && this.props.onLongPressOut('to')
    }

    private readonly onPeriodButtonLongPress = (ev: LongPressGestureHandlerStateChangeEvent) => {

        if (ev.nativeEvent.state === GestureState.ACTIVE) {
            Haptic.trigger("impactHeavy", {
                enableVibrateFallback: true,
                ignoreAndroidSystemSettings: true
            })
            this.props.onLongPressIn && this.props.onLongPressIn('period')

        } else if (ev.nativeEvent.state === GestureState.END) {
            this.props.onLongPressOut && this.props.onLongPressOut('period')
        }
    }

    componentDidUpdate() {
    }

    render() {
        var modalPickerView
        if (this.state.clickedElementType) {

            switch (this.state.clickedElementType) {
                case 'period':
                    switch (this.state.level) {
                        case 'week':
                            modalPickerView = <WeekPicker selectedWeekFirstDay={this.state.fromDate} onWeekSelected={this.onWeekSelected} />
                            break;
                        case 'month':
                            modalPickerView = <MonthPicker selectedMonth={this.state.fromDate} onMonthSelected={this.setMonthByCalendar} />
                            break;
                        case 'year':
                            modalPickerView = <YearPicker year={getYear(this.state.fromDate)} onYearSelected={this.onYearSelected}/>
                            break;
                    }
                    break;
                case 'from':
                    modalPickerView = <DatePicker selectedDay={this.state.fromDate}
                        disabledDates={[this.state.toDate]}
                        onDayPress={this.setFromDate} ghostRange={[this.state.fromDate, this.state.toDate]} />
                    break;
                case 'to':
                    modalPickerView = <DatePicker selectedDay={this.state.toDate}
                        disabledDates={[this.state.fromDate]}
                        onDayPress={this.setToDate}
                        ghostRange={[this.state.fromDate, this.state.toDate]} />
                    break;
            }
        }

        return <FlingGestureHandler
            direction={Directions.LEFT}
            onHandlerStateChange={this.onSwipeLeft}
        >
            <FlingGestureHandler
                direction={Directions.RIGHT}
                onHandlerStateChange={this.onSwipeRight}
            >
                <View style={{
                    ...(this.props.showBorder === true ? styles.conatainerWithBorder : styles.containerStyle),
                    backgroundColor: this.props.isLightMode ? null : styles.containerStyle.backgroundColor
                } as ViewStyle}>
                    <SwipedFeedback ref={this.swipedFeedbackRef} />

                    <DateButton ref={this.fromButtonRef} date={this.state.from} onPress={this.onFromDatePressed}
                        isLightMode={this.props.isLightMode}
                        showSpeechIndicator={this.props.showSpeechIndicator}
                        onLongPressIn={this.onFromButtonLongPressIn} onLongPressOut={this.onFromButtonLongPressOut} />

                    <View style={styles.midViewContainerStyle} >
                        <Dash style={styles.dashViewStyle} dashGap={4} dashColor="gray" dashLength={3} dashThickness={3} dashStyle={styles.dashLineStyle} />
                        <View style={styles.midViewFooterContainerStyle}>

                            {
                                this.state.semanticPeriodCaptured === true ? (
                                    <LongPressGestureHandler
                                        maxDist={Number.MAX_VALUE}
                                        shouldCancelWhenOutside={false}
                                        onHandlerStateChange={this.onPeriodButtonLongPress}
                                    ><BorderlessButton onPress={this.onPeriodPressed}
                                    >
                                            <View style={styles.periodButtonStyle}
                                                hitSlop={{ top: 15, bottom: 15 }}>
                                                <Text style={styles.periodButtonTitleStyle}>{this.state.periodName}</Text>
                                            </View>

                                        </BorderlessButton></LongPressGestureHandler>
                                ) : (
                                        <Text style={styles.midViewDescriptionTextStyle}>{this.state.numDays} Days</Text>
                                    )
                            }

                        </View>
                    </View>

                    <DateButton ref={this.toButtonRef} date={this.state.to} onPress={this.onToDatePressed}
                        isLightMode={this.props.isLightMode}
                        showSpeechIndicator={this.props.showSpeechIndicator}
                        onLongPressIn={this.onToButtonLongPressIn} onLongPressOut={this.onToButtonLongPressOut} />

                    <BottomSheet ref={this.bottomSheetRef}>
                        {modalPickerView}
                    </BottomSheet>

                </View>
            </FlingGestureHandler>
        </FlingGestureHandler>
    }
}

//Year Picker============================================================================================================================================

const YearPicker = React.memo((props: { year: number, onYearSelected: (year: number) => void }) => {

    const [selectedIndex, setSelectedIndex] = useState(0)
    const [minimumYear, setMinimumYear] = useState(getYear(new Date()) - 10)

    const serviceKey = useSelector((appState: ReduxAppState) => {
        return appState.settingsState.serviceKey
    })

    useEffect(() => {
        const service = DataServiceManager.instance.getServiceByKey(serviceKey)
        const fetchInitialDate = async () => {
            const initialDate = await service.getDataInitialDate()
            setMinimumYear(DateTimeHelper.getYear(initialDate))
        }

        fetchInitialDate()
    }, [serviceKey])


    const maximumYear = useMemo(() => {
        return getYear(DataServiceManager.instance.getServiceByKey(serviceKey).getToday())
    }, [serviceKey])

    const yearLabels: Array<string> = useMemo(() => getNumberSequence(minimumYear, maximumYear).map(y => y.toString()), [minimumYear, maximumYear])

    useEffect(() => {
        setSelectedIndex(yearLabels.indexOf(props.year.toString()))
    }, [props.year, yearLabels])

    const onItemSelected = useCallback((index) => {
        setSelectedIndex(index)
    }, [yearLabels])

    const onApplyPress = useCallback(() => {
        props.onYearSelected(Number.parseInt(yearLabels[selectedIndex]))
    }, [selectedIndex, yearLabels, props.onYearSelected])

    return <>
        <Button type="clear" title="Apply" style={styles.yearPopupButtonStyle} onPress={onApplyPress}/>
        <WheelPicker
            selectedItemTextFontFamily={undefined}
            itemTextFontFamily={undefined}
            style={StyleTemplates.wheelPickerCommonStyle}
            data={yearLabels}
            initPosition={yearLabels.indexOf(props.year.toString())}
            selectedItem={selectedIndex}
            onItemSelected={onItemSelected}
        />
    </>
})


//Date Button============================================================================================================================================


interface DateButtonApi {
    playDenialAnimation: () => void
}
interface DateButtonProps {
    date: number, overrideFormat?: string, freeWidth?: boolean, onPress: () => void,
    showSpeechIndicator?: boolean,
    onLongPressIn?: () => void,
    onLongPressOut?: () => void,
    isLightMode?: boolean,
}

const DateButton = React.forwardRef((props: DateButtonProps, ref: any) => {

    const serviceKey = useSelector((appState: ReduxAppState) => appState.settingsState.serviceKey)
    const today = DataServiceManager.instance.getServiceByKey(serviceKey).getToday()

    const date = DateTimeHelper.toDate(props.date)
    const dateString = format(date, props.overrideFormat || "MMM dd, yyyy")
    const subText = isToday(date, today) === true ? 'Today' : (isYesterday(date, today) === true ? "Yesterday" : format(date, "EEEE"))

    const [movement] = useState(new Animated.Value(0))

    useImperativeHandle(ref, () => ({
        playDenialAnimation: () => {
            movement.setValue(0)
            Animated.timing(movement, denialAnimationSettings.timingConfig).start()
        }
    }), [movement])

    const onLongPressStateChange = useCallback((ev: LongPressGestureHandlerStateChangeEvent) => {
        if (ev.nativeEvent.state === GestureState.ACTIVE) {
            props.onLongPressIn && props.onLongPressIn()
        } else if (ev.nativeEvent.state === GestureState.END) {
            props.onLongPressOut && props.onLongPressOut()
        }
    }, [props.onLongPressIn, props.onLongPressOut])

    return <LongPressGestureHandler onHandlerStateChange={onLongPressStateChange}
        shouldCancelWhenOutside={false}
        maxDist={150}>
        <BorderlessButton onPress={props.onPress} shouldCancelWhenOutside={false} rippleColor={"rgba(255,255,255,0.2)"}>
            <Animated.View style={{
                ...(props.freeWidth === true ? styles.dateButtonContainerStyleFreeWidth : styles.dateButtonContainerStyle),
                transform: [{ translateX: movement.interpolate(denialAnimationSettings.interpolationConfig) }]
            }}>
                <View style={styles.dateButtonDatePartStyle}>
                    <Text style={props.isLightMode === true ? styles.dateButtonDateTextStyleLight : styles.dateButtonDateTextStyle}>{dateString}</Text>
                    {props.showSpeechIndicator !== false ? <View style={styles.dateButtonIndicatorContainerStyle}>
                        <SpeechAffordanceIndicator />
                    </View> : null}
                </View>
                <Text style={styles.midViewDescriptionTextStyle}>
                    {subText}
                </Text></Animated.View>
        </BorderlessButton>
    </LongPressGestureHandler>
})



//Date Bar============================================================================================================================================

export const DateBar = React.memo((props: {
    date: number,
    onDateChanged?: (date: number, interactionType: InteractionType) => void,
    onLongPressIn: () => void,
    onLongPressOut: () => void
}) => {

    const [date, setDate] = useState(props.date)

    useEffect(() => {
        setDate(props.date)
    }, [props.date])

    const bottomSheetRef = useRef<BottomSheet>(null)
    const swipedFeedbackRef = useRef<SwipedFeedback>(null)

    const serviceKey = useSelector((appState: ReduxAppState) => appState.settingsState.serviceKey)
    const getToday = DataServiceManager.instance.getServiceByKey(serviceKey).getToday

    const makeShiftDay = useMemo(() => (amount: number) => () => {
        const newDate = addDays(DateTimeHelper.toDate(date), amount)
        if (differenceInCalendarDays(newDate, getToday()) < 1) {
            const newNumberedDate = DateTimeHelper.toNumberedDateFromDate(newDate)
            setDate(newNumberedDate)
            props.onDateChanged && props.onDateChanged(newNumberedDate, InteractionType.TouchOnly)
            swipedFeedbackRef.current?.startFeedback(amount > 0 ? 'left' : 'right')
        }
    }, [date, setDate, props.onDateChanged, swipedFeedbackRef])

    const shiftLeft = useMemo(() => makeShiftDay(1), [makeShiftDay])
    const shiftRight = useMemo(() => makeShiftDay(-1), [makeShiftDay])

    const swipeLeft = useCallback((ev: FlingGestureHandlerStateChangeEvent) => {
        if (ev.nativeEvent.state === GestureState.ACTIVE) {
            shiftLeft()
        }
    }, [shiftLeft])

    const swipeRight = useCallback((ev: FlingGestureHandlerStateChangeEvent) => {
        if (ev.nativeEvent.state === GestureState.ACTIVE) {
            shiftRight()
        }
    }, [shiftRight])



    const onPress = useCallback(() => { bottomSheetRef.current?.open() }, [bottomSheetRef])

    const onCalendarDayPress = useCallback((d) => {
        const newDate = DateTimeHelper.toNumberedDateFromDate(d)
        setDate(newDate)
        bottomSheetRef.current?.close()
        props.onDateChanged && props.onDateChanged(newDate, InteractionType.TouchOnly)
    }, [setDate, bottomSheetRef, props.onDateChanged])

    return <FlingGestureHandler
        direction={Directions.LEFT}
        onHandlerStateChange={swipeLeft}
    >
        <FlingGestureHandler
            direction={Directions.RIGHT}
            onHandlerStateChange={swipeRight}
        >
            <View style={styles.containerStyle}>
                <SwipedFeedback ref={swipedFeedbackRef} />

                <DateButton date={date} overrideFormat="MMMM dd, yyyy" freeWidth={true}
                    onPress={onPress}
                    onLongPressIn={props.onLongPressIn}
                    onLongPressOut={props.onLongPressOut}
                />

                <BottomSheet ref={bottomSheetRef}>
                    <DatePicker selectedDay={DateTimeHelper.toDate(date)}
                        latestPossibleDay={getToday()}
                        onDayPress={onCalendarDayPress} />
                </BottomSheet>
            </View>

        </FlingGestureHandler>
    </FlingGestureHandler>
})
