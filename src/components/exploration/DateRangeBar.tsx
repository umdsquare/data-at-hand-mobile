import React, { useState } from "react";
import { View, StyleSheet, Text, ViewStyle, TextStyle, TouchableOpacity } from "react-native";
import Colors from "../../style/Colors";
import { SpeechAffordanceIndicator } from "./SpeechAffordanceIndicator";
import { Sizes } from "../../style/Sizes";
import Dash from 'react-native-dash';
import { Button } from "react-native-elements";
import { format, differenceInCalendarDays, isFirstDayOfMonth, isLastDayOfMonth, isMonday, isSunday, addDays, subDays, startOfMonth, endOfMonth, subMonths, addMonths, differenceInDays } from "date-fns";
import GestureRecognizer from 'react-native-swipe-gestures';
import { DatePicker, WeekPicker, MonthPicker } from "../common/CalendarPickers";
import { InteractionType } from "../../state/exploration/interaction/actions";
import { DateTimeHelper, isToday, isYesterday } from "../../time";
import { SwipedFeedback } from "../common/SwipedFeedback";
import { BottomSheet } from "../common/BottomSheet";
import Haptic from "react-native-haptic-feedback";
import { useSelector } from "react-redux";
import { ReduxAppState } from "../../state/types";
import { DataServiceManager } from "../../system/DataServiceManager";

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
    color: 'white',
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

})

export type ElementType = 'from' | 'to' | 'period'

interface Props {
    from: number,
    to: number,
    onRangeChanged?: (from: number, to: number, interactionType?: InteractionType) => void,
    onLongPressIn?: (position: ElementType) => void,
    onLongPressOut?: (porition: ElementType) => void,
    showBorder?: boolean,
    isLightMode?: boolean
}

interface State {
    from: number,
    to: number,
    fromDate: Date,
    toDate: Date,
    semanticPeriodCaptured: boolean,
    numDays: number,
    level?: "day" | "week" | "month",
    periodName?: string,
    clickedElementType?: ElementType,
    isPeriodButtonLongPressed: boolean
}

const DateButton = (props: {
    date: number, overrideFormat?: string, freeWidth?: boolean, onPress: () => void,
    onLongPressIn?: () => void,
    onLongPressOut?: () => void,
    isLightMode?: boolean
}) => {

    const serviceKey = useSelector((appState:ReduxAppState) => appState.settingsState.serviceKey)
    const today = DataServiceManager.instance.getServiceByKey(serviceKey).getToday()

    const [isLongPressed, setIsLongPressed] = useState(false)

    const date = DateTimeHelper.toDate(props.date)
    const dateString = format(date, props.overrideFormat || "MMM dd, yyyy")
    const subText = isToday(date, today) === true ? 'Today' : (isYesterday(date, today) === true ? "Yesterday" : format(date, "EEEE"))
    return <TouchableOpacity
        onPress={props.onPress}
        onLongPress={() => {
            setIsLongPressed(true)
            if (props.onLongPressIn) {
                props.onLongPressIn()
            }
        }}
        onPressOut={() => {
            if (isLongPressed === true && props.onLongPressOut) {
                props.onLongPressOut()
            }
            setIsLongPressed(false)
        }}
    >
        <View style={props.freeWidth === true ? styles.dateButtonContainerStyleFreeWidth : styles.dateButtonContainerStyle}>
            <View style={styles.dateButtonDatePartStyle}>
                <Text style={props.isLightMode === true ? styles.dateButtonDateTextStyleLight : styles.dateButtonDateTextStyle}>{dateString}</Text>
                <View style={styles.dateButtonIndicatorContainerStyle}>
                    <SpeechAffordanceIndicator />
                </View>
            </View>
            <Text style={styles.midViewDescriptionTextStyle}>
                {subText}
            </Text></View>
    </TouchableOpacity>
}

export class DateRangeBar extends React.PureComponent<Props, State> {

    static deriveState(from: number, to: number, prevState: State): State {

        const fromDate = DateTimeHelper.toDate(from)
        const toDate = DateTimeHelper.toDate(to)
        const numDays = -differenceInCalendarDays(fromDate, toDate) + 1

        if (DateTimeHelper.getMonth(from) === DateTimeHelper.getMonth(to) && isFirstDayOfMonth(fromDate) === true && isLastDayOfMonth(toDate)) {
            //month
            return {
                ...prevState,
                from,
                to,
                fromDate,
                toDate,
                semanticPeriodCaptured: true,
                numDays: numDays,
                level: "month",
                periodName: format(fromDate, "MMM yyyy")
            }
        } else if (numDays === 7 && (isMonday(fromDate) || isSunday(fromDate))) {
            return {
                ...prevState,
                from,
                to,
                fromDate,
                toDate,
                semanticPeriodCaptured: true,
                numDays: numDays,
                level: "week",
                periodName: "Week of " + format(fromDate, "MMM dd")
            }
        } else {
            return {
                ...prevState,
                from,
                to,
                fromDate,
                toDate,
                semanticPeriodCaptured: false,
                numDays: numDays,
                level: "day",
                periodName: null
            }
        }
    }

    static getDerivedStateFromProps(nextProps: Props, currentState: State): State {
        if (currentState.from !== nextProps.from ||
            currentState.to !== nextProps.to) {
            return DateRangeBar.deriveState(nextProps.from, nextProps.to, currentState)
        }
        return null
    }

    private swipedFeedbackRef: SwipedFeedback
    private bottomSheetRef: BottomSheet

    constructor(props: Props) {
        super(props)
        this.state = DateRangeBar.deriveState(props.from, props.to, { isBottomSheetOpen: false, isPeriodButtonLongPressed: false } as any)
    }

    private onClickedElement(type: ElementType) {
        this.setState({
            ...this.state,
            clickedElementType: type,
        })
        this.bottomSheetRef.open()
    }

    onFromDatePressed = () => {
        this.onClickedElement('from')
    }

    onToDatePressed = () => {
        this.onClickedElement('to')
    }

    onPeriodPressed = () => {
        this.onClickedElement('period')
    }

    onSwipeLeft = () => {

        var from: Date
        var to: Date
        if (this.state.level !== 'month') {
            from = addDays(this.state.fromDate, this.state.numDays)
            to = addDays(this.state.toDate, this.state.numDays)
        } else {
            const lastMonthFirst = addMonths(this.state.fromDate, 1)
            const lastMonthLast = endOfMonth(lastMonthFirst)
            from = lastMonthFirst
            to = lastMonthLast
        }
        this.setRange(DateTimeHelper.toNumberedDateFromDate(from), DateTimeHelper.toNumberedDateFromDate(to), InteractionType.TouchOnly)
        this.swipedFeedbackRef.startFeedback('left')
    }

    onSwipeRight = () => {

        var from: Date
        var to: Date
        if (this.state.level !== 'month') {
            from = subDays(this.state.fromDate, this.state.numDays)
            to = subDays(this.state.toDate, this.state.numDays)
        } else {
            const lastMonthFirst = subMonths(this.state.fromDate, 1)
            const lastMonthLast = endOfMonth(lastMonthFirst)
            from = lastMonthFirst
            to = lastMonthLast
        }
        this.setRange(DateTimeHelper.toNumberedDateFromDate(from), DateTimeHelper.toNumberedDateFromDate(to), InteractionType.TouchOnly)
        this.swipedFeedbackRef.startFeedback('right')
    }

    setRange = (from: number, to: number, interactionType: InteractionType = InteractionType.TouchOnly) => {
        this.setState(DateRangeBar.deriveState(
            from,
            to,
            { ...this.state, clickedElementType: null }
        ))

        this.bottomSheetRef?.close()

        if (this.props.onRangeChanged) {
            this.props.onRangeChanged(from, to, interactionType)
        }
    }

    setFromDate = (from: Date, interactionType: InteractionType = InteractionType.TouchOnly) => {
        this.setRange(DateTimeHelper.toNumberedDateFromDate(from), this.state.to, interactionType)
    }

    setToDate = (to: Date, interactionType: InteractionType = InteractionType.TouchOnly) => {
        this.setRange(
            this.state.from, DateTimeHelper.toNumberedDateFromDate(to), interactionType)
    }

    setMonth = (monthDate: Date, interactionType: InteractionType) => {
        this.setRange(DateTimeHelper.toNumberedDateFromDate(startOfMonth(monthDate)),
            DateTimeHelper.toNumberedDateFromDate(endOfMonth(monthDate)), interactionType)
    }

    setMonthByCalendar = (monthDate: Date) => {
        this.setMonth(monthDate, InteractionType.TouchOnly)
    }

    onFromButtonLongPressIn = () => {
        Haptic.trigger("impactHeavy", {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: true
        })

        this.props.onLongPressIn && this.props.onLongPressIn('from')
    }

    onFromButtonLongPressOut = () => {
        this.props.onLongPressOut && this.props.onLongPressOut('from')
    }


    onToButtonLongPressIn = () => {
        Haptic.trigger("impactHeavy", {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: true
        })
        this.props.onLongPressIn && this.props.onLongPressIn('to')
    }

    onToButtonLongPressOut = () => {
        this.props.onLongPressOut && this.props.onLongPressOut('to')
    }

    onPeriodButtonLongPress = () => {
        Haptic.trigger("impactHeavy", {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: true
        })
        this.props.onLongPressIn && this.props.onLongPressIn('period')
        this.setState({
            ...this.state,
            isPeriodButtonLongPressed: true
        })
    }

    onPeriodButtonPressOut = () => {
        if (this.state.isPeriodButtonLongPressed === true) {
            this.props.onLongPressOut && this.props.onLongPressOut('period')
        }

        this.setState({
            ...this.state,
            isPeriodButtonLongPressed: false
        })
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
                            modalPickerView = <WeekPicker selectedWeekFirstDay={this.state.fromDate} onWeekSelected={(start, end) => this.setRange(DateTimeHelper.toNumberedDateFromDate(start), DateTimeHelper.toNumberedDateFromDate(end))} />
                            break;
                        case 'month':
                            modalPickerView = <MonthPicker selectedMonth={this.state.fromDate} onMonthSelected={this.setMonthByCalendar} />
                            break;
                    }
                    break;
                case 'from':
                    modalPickerView = <DatePicker selectedDay={this.state.fromDate} earliedPossibleDay={undefined} latestPossibleDay={subDays(this.state.toDate, 1)} onDayPress={this.setFromDate} ghostRange={[this.state.fromDate, this.state.toDate]} />
                    break;
                case 'to':
                    modalPickerView = <DatePicker selectedDay={this.state.toDate} earliedPossibleDay={addDays(this.state.fromDate, 1)} latestPossibleDay={undefined} onDayPress={this.setToDate} ghostRange={[this.state.fromDate, this.state.toDate]} />
                    break;
            }
        }

        return <GestureRecognizer
            onSwipeLeft={this.onSwipeLeft}
            onSwipeRight={this.onSwipeRight}
            style={{
                ...(this.props.showBorder === true ? styles.conatainerWithBorder : styles.containerStyle),
                backgroundColor: this.props.isLightMode ? null : styles.containerStyle.backgroundColor
            }}>
            <SwipedFeedback ref={ref => this.swipedFeedbackRef = ref} />

            <DateButton date={this.state.from} onPress={this.onFromDatePressed} isLightMode={this.props.isLightMode}
                onLongPressIn={this.onFromButtonLongPressIn} onLongPressOut={this.onFromButtonLongPressOut} />

            <View style={styles.midViewContainerStyle} >
                <Dash style={styles.dashViewStyle} dashGap={4} dashColor="gray" dashLength={3} dashThickness={3} dashStyle={styles.dashLineStyle} />
                <View style={styles.midViewFooterContainerStyle}>

                    {
                        this.state.semanticPeriodCaptured === true ? (
                            <Button onPress={this.onPeriodPressed} title={this.state.periodName}
                                buttonStyle={styles.periodButtonStyle} titleStyle={styles.periodButtonTitleStyle}
                                onLongPress={this.onPeriodButtonLongPress}
                                onPressOut={this.onPeriodButtonPressOut}
                            />
                        ) : (
                                <Text style={styles.midViewDescriptionTextStyle}>{this.state.numDays} Days</Text>
                            )
                    }

                </View>
            </View>

            <DateButton date={this.state.to} onPress={this.onToDatePressed} isLightMode={this.props.isLightMode}
                onLongPressIn={this.onToButtonLongPressIn} onLongPressOut={this.onToButtonLongPressOut} />

            <BottomSheet ref={ref => { this.bottomSheetRef = ref }}>
                {modalPickerView}
            </BottomSheet>

        </GestureRecognizer>
    }
}



export const DateBar = (props: {
    date: number,
    onDateChanged?: (date: number, interactionType?: InteractionType) => void,
    onLongPressIn: () => void,
    onLongPressOut: () => void
}) => {

    const [date, setDate] = useState(props.date)

    const serviceKey = useSelector((appState:ReduxAppState) => appState.settingsState.serviceKey)
    const getToday = DataServiceManager.instance.getServiceByKey(serviceKey).getToday

    const shiftDay = (amount: number) => {
        const newDate = addDays(DateTimeHelper.toDate(date), amount)
        if (differenceInCalendarDays(newDate, getToday()) < 1) {
            const newNumberedDate = DateTimeHelper.toNumberedDateFromDate(newDate)
            setDate(newNumberedDate)
            props.onDateChanged && props.onDateChanged(newNumberedDate, InteractionType.TouchOnly)
            if (swipedFeedbackRef != null) {
                swipedFeedbackRef.startFeedback(amount > 0 ? 'left' : 'right')
            }
        }
    }

    let bottomSheetRef: BottomSheet

    let swipedFeedbackRef: SwipedFeedback

    return <GestureRecognizer onSwipeLeft={() => shiftDay(1)} onSwipeRight={() => shiftDay(-1)} style={styles.containerStyle}>
        <SwipedFeedback ref={ref => swipedFeedbackRef = ref} />
        <DateButton date={date} overrideFormat="MMMM dd, yyyy" freeWidth={true}
            onPress={() => { bottomSheetRef.open() }}
            onLongPressIn={props.onLongPressIn}
            onLongPressOut={props.onLongPressOut}
        />

        <BottomSheet ref={ref => { bottomSheetRef = ref }}>
            <DatePicker selectedDay={DateTimeHelper.toDate(date)}
                latestPossibleDay={getToday()}
                onDayPress={(d) => {
                    const newDate = DateTimeHelper.toNumberedDateFromDate(d)
                    setDate(newDate)
                    bottomSheetRef.close()
                    props.onDateChanged && props.onDateChanged(newDate, InteractionType.TouchOnly)
                }} />
        </BottomSheet>
    </GestureRecognizer>
}
