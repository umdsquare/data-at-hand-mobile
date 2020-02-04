import React, { useState } from "react";
import { View, StyleSheet, Text, ViewStyle } from "react-native";
import Colors from "../../style/Colors";
import { SpeechAffordanceIndicator } from "./SpeechAffordanceIndicator";
import { Sizes } from "../../style/Sizes";
import Dash from 'react-native-dash';
import { Button } from "react-native-elements";
import { format, isToday, isYesterday, differenceInCalendarDays, isSameMonth, isFirstDayOfMonth, isLastDayOfMonth, isMonday, isSunday, addDays, subDays, startOfMonth, endOfMonth, subMonths, addMonths, startOfDay, endOfDay, isSameDay } from "date-fns";
import { TouchableOpacity } from "react-native-gesture-handler";
import GestureRecognizer from 'react-native-swipe-gestures';
import Modal from "react-native-modal";
import { StyleTemplates } from "../../style/Styles";
import { DatePicker, WeekPicker, MonthPicker } from "../common/CalendarPickers";
import { SafeAreaConsumer } from "react-native-safe-area-context";
import { InteractionType } from "../../state/exploration/interaction/actions";
import { DateTimeHelper } from "../../time";
import { SwipedFeedback } from "../common/SwipedFeedback";

const dateButtonWidth = 140
const barHeight = 60

const dateButtonSubTextStyle = {
    marginTop: 2,
    fontSize: Sizes.tinyFontSize,
    color: 'white',
    opacity: 0.58
}

const conatinerStyleBase = {
    alignSelf: 'stretch',
    backgroundColor: "#00000025",
    height: barHeight,
    flexDirection: 'row',
    justifyContent: 'center'
} as ViewStyle

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
    dateButtonDateTextStyle: {
        fontSize: Sizes.normalFontSize,
        color: 'white',
        fontWeight: '600',
        marginRight: 4,
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

interface Props {
    from: number,
    to: number,
    onRangeChanged?: (from: number, to: number, interactionType?: InteractionType) => void,
    showBorder?: boolean
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
    clickedElementType?: 'from' | 'to' | 'period',
    isBottomSheetOpen?: boolean
}

const DateButton = (props: { date: number, overrideFormat?: string, freeWidth?: boolean, onPress: () => void }) => {
    const date = DateTimeHelper.toDate(props.date)
    const dateString = format(date, props.overrideFormat || "MMM dd, yyyy")
    const subText = isToday(date) === true ? 'Today' : (isYesterday(date) === true ? "Yesterday" : format(date, "EEEE"))
    return <TouchableOpacity onPress={props.onPress}>
        <View style={props.freeWidth === true ? styles.dateButtonContainerStyleFreeWidth : styles.dateButtonContainerStyle}>
        <View style={styles.dateButtonDatePartStyle}>
            <Text style={styles.dateButtonDateTextStyle}>{dateString}</Text>
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

    constructor(props: Props) {
        super(props)
        this.state = DateRangeBar.deriveState(props.from, props.to, { isBottomSheetOpen: false } as any)
    }

    private onClickedElement(type: 'from' | 'to' | 'period') {
        this.setState({
            ...this.state,
            clickedElementType: type,
            isBottomSheetOpen: true
        })
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

    closeBottomSheet = () => {
        this.setState({
            ...this.state,
            isBottomSheetOpen: false,
            clickedElementType: null
        })
    }

    setRange = (from: number, to: number, interactionType: InteractionType = InteractionType.TouchOnly) => {
        this.setState(DateRangeBar.deriveState(
            from,
            to,
            { ...this.state, isBottomSheetOpen: false, clickedElementType: null }
        ))

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

        return <GestureRecognizer onSwipeLeft={this.onSwipeLeft} onSwipeRight={this.onSwipeRight} style={this.props.showBorder===true ? styles.conatainerWithBorder : styles.containerStyle}>
            <SwipedFeedback ref={ref => this.swipedFeedbackRef = ref}/>
            <DateButton date={this.state.from} onPress={this.onFromDatePressed} />
            <View style={styles.midViewContainerStyle} >
                <Dash style={styles.dashViewStyle} dashGap={4} dashColor="gray" dashLength={3} dashThickness={3} dashStyle={styles.dashLineStyle} />
                <View style={styles.midViewFooterContainerStyle}>

                    {
                        this.state.semanticPeriodCaptured === true ? (
                            <Button onPress={this.onPeriodPressed} title={this.state.periodName} buttonStyle={styles.periodButtonStyle} titleStyle={styles.periodButtonTitleStyle} />
                        ) : (
                                <Text style={styles.midViewDescriptionTextStyle}>{this.state.numDays} Days</Text>
                            )
                    }

                </View>
            </View>
            <DateButton date={this.state.to} onPress={this.onToDatePressed} />

            <Modal
                isVisible={this.state.isBottomSheetOpen === true}
                onBackdropPress={this.closeBottomSheet}
                style={StyleTemplates.bottomSheetModalContainerStyle}
                backdropOpacity={0.3}
            >
                <SafeAreaConsumer>{
                    inset =>
                        <View style={{ ...StyleTemplates.bottomSheetModalViewStyle, paddingBottom: Math.max(20, inset.bottom) }}>
                            {
                                modalPickerView
                            }
                        </View>
                }</SafeAreaConsumer>
            </Modal>

        </GestureRecognizer>
    }
}



export const DateBar = (props: {
    date: number,
    onDateChanged?: (date: number, interactionType?: InteractionType) => void
}) => {

    const [date, setDate] = useState(props.date)
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)

    const shiftDay = (amount: number) => {
        const newDate = addDays(DateTimeHelper.toDate(date), amount)
        if (differenceInCalendarDays(newDate, new Date()) < 1) {
            const newNumberedDate = DateTimeHelper.toNumberedDateFromDate(newDate)
            setDate(newNumberedDate)
            props.onDateChanged && props.onDateChanged(newNumberedDate, InteractionType.TouchOnly)
        }
    }


    return <GestureRecognizer onSwipeLeft={() => shiftDay(1)} onSwipeRight={() => shiftDay(-1)} style={styles.containerStyle}>
        <DateButton date={date} overrideFormat="MMMM dd, yyyy" freeWidth={true} onPress={() => { setIsBottomSheetOpen(true) }} />

        <Modal
            isVisible={isBottomSheetOpen === true}
            onBackdropPress={() => { setIsBottomSheetOpen(false) }}
            style={StyleTemplates.bottomSheetModalContainerStyle}
            backdropOpacity={0.3}
        >
            <SafeAreaConsumer>{
                inset =>
                    <View style={{ ...StyleTemplates.bottomSheetModalViewStyle, paddingBottom: Math.max(20, inset.bottom) }}>
                        {
                            <DatePicker selectedDay={DateTimeHelper.toDate(date)}
                                latestPossibleDay={new Date()}
                                onDayPress={(d) => {
                                    const newDate = DateTimeHelper.toNumberedDateFromDate(d)
                                    setDate(newDate)
                                    setIsBottomSheetOpen(false)
                                    props.onDateChanged && props.onDateChanged(newDate, InteractionType.TouchOnly)
                                }} />
                        }
                    </View>
            }</SafeAreaConsumer>
        </Modal>
    </GestureRecognizer>
}
