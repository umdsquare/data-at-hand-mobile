import React from "react";
import { View, StyleSheet, Text, SafeAreaView } from "react-native";
import Colors from "../../style/Colors";
import { SpeechAffordanceIndicator } from "./SpeechAffordanceIndicator";
import { Sizes } from "../../style/Sizes";
import Dash from 'react-native-dash';
import { Button } from "react-native-elements";
import { format, isToday, isYesterday, differenceInCalendarDays, isSameMonth, isFirstDayOfMonth, isLastDayOfMonth, isMonday, isSunday, addDays, subDays, startOfMonth, endOfMonth, subMonths, addMonths, startOfDay, endOfDay } from "date-fns";
import { TouchableOpacity } from "react-native-gesture-handler";
import GestureRecognizer from 'react-native-swipe-gestures';
import Modal from "react-native-modal";
import { StyleTemplates } from "../../style/Styles";
import { DatePicker, WeekPicker, MonthPicker } from "../common/CalendarPickers";

const dateButtonWidth = 140
const barHeight = 60

const dateButtonSubTextStyle = {
    marginTop: 2,
    fontSize: Sizes.tinyFontSize,
    color: 'white',
    opacity: 0.58
}

const styles = StyleSheet.create({
    containerStyle: {
        alignSelf: 'stretch',
        backgroundColor: "#00000025",
        height: barHeight,
        flexDirection: 'row'
    },
    dateButtonContainerStyle: {
        height: barHeight,
        justifyContent: 'center',
        alignItems: 'center',
        width: dateButtonWidth
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
    from: Date,
    to: Date,
    onRangeChanged?: (from: Date, to: Date) => void
}

interface State {
    from: Date,
    to: Date,
    semanticPeriodCaptured: boolean,
    numDays: number,
    level?: "day" | "week" | "month",
    periodName?: string,
    clickedElementType?: 'from' | 'to' | 'period',
    isBottomSheetOpen?: boolean
}

export class DateRangeBar extends React.Component<Props, State> {

    static deriveState(from: Date, to: Date, prevState: State): State {
        const numDays = -differenceInCalendarDays(from, to) + 1

        if (isSameMonth(from, to) === true && isFirstDayOfMonth(from) === true && isLastDayOfMonth(to)) {
            //month
            return {
                ...prevState,
                from: from,
                to: to,
                semanticPeriodCaptured: true,
                numDays: numDays,
                level: "month",
                periodName: format(from, "MMM yyyy")
            }
        } else if (numDays === 7 && (isMonday(from) || isSunday(from))) {
            return {
                ...prevState,
                from: from,
                to: to,
                semanticPeriodCaptured: true,
                numDays: numDays,
                level: "week",
                periodName: "Week of " + format(from, "MMM dd")
            }
        } else {
            return {
                ...prevState,
                from: from,
                to: to,
                semanticPeriodCaptured: false,
                numDays: numDays,
                level: "day",
                periodName: null
            }
        }
    }

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
            from = addDays(this.state.from, this.state.numDays)
            to = addDays(this.state.to, this.state.numDays)
        } else {
            const lastMonthFirst = addMonths(this.state.from, 1)
            const lastMonthLast = endOfMonth(lastMonthFirst)
            from = lastMonthFirst
            to = lastMonthLast
        }
        this.setRange(from, to)
    }

    onSwipeRight = () => {
        var from: Date
        var to: Date
        if (this.state.level !== 'month') {
            from = subDays(this.state.from, this.state.numDays)
            to = subDays(this.state.to, this.state.numDays)
        }else {
            const lastMonthFirst = subMonths(this.state.from, 1)
            const lastMonthLast = endOfMonth(lastMonthFirst)
            from = lastMonthFirst
            to = lastMonthLast
        }
        this.setRange(from, to)
    }

    closeBottomSheet = () => {
        this.setState({
            ...this.state,
            isBottomSheetOpen: false,
            clickedElementType: null
        })
    }

    setRange = (from: Date, to: Date) => {
        this.setState(DateRangeBar.deriveState(
            from,
            to,
            { ...this.state, isBottomSheetOpen: false, clickedElementType: null }
        ))

        if(this.props.onRangeChanged){
            this.props.onRangeChanged(startOfDay(from), endOfDay(to))
        }
    }

    setFromDate = (from: Date) => {
        this.setRange(from, this.state.to)
    }

    setToDate = (to: Date) => {
        this.setRange(
            this.state.from, to)
    }

    setMonth = (monthDate: Date) => {
        this.setRange(startOfMonth(monthDate), endOfMonth(monthDate))
    }


    render() {

        var modalPickerView
        if (this.state.clickedElementType) {

            switch (this.state.clickedElementType) {
                case 'period':
                    switch (this.state.level) {
                        case 'week':
                            modalPickerView = <WeekPicker selectedWeekFirstDay={this.state.from} onWeekSelected={this.setRange} />
                            break;
                        case 'month':
                            modalPickerView = <MonthPicker selectedMonth={this.state.from} onMonthSelected={this.setMonth} />
                            break;
                    }
                    break;
                case 'from':
                    modalPickerView = <DatePicker selectedDay={this.state.from} earliedPossibleDay={undefined} latestPossibleDay={subDays(this.state.to, 1)} onDayPress={this.setFromDate} ghostRange={[this.state.from, this.state.to]} />
                    break;
                case 'to':
                    modalPickerView = <DatePicker selectedDay={this.state.to} earliedPossibleDay={addDays(this.state.from, 1)} latestPossibleDay={undefined} onDayPress={this.setToDate} ghostRange={[this.state.from, this.state.to]} />
                    break;
            }
        }

        return <GestureRecognizer onSwipeLeft={this.onSwipeLeft} onSwipeRight={this.onSwipeRight} style={styles.containerStyle}>
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
                <View style={StyleTemplates.bottomSheetModalViewStyle}>
                    <SafeAreaView>
                        {
                            modalPickerView
                        }
                    </SafeAreaView>
                </View>
            </Modal>

        </GestureRecognizer>
    }
}

const DateButton = (props: { date: Date, onPress: () => void }) => {
    const dateString = format(props.date, "MMM dd, yyyy")
    const subText = isToday(props.date) === true ? 'Today' : (isYesterday(props.date) === true ? "Yesterday" : format(props.date, "EEEE"))
    return <TouchableOpacity onPress={props.onPress}><View style={styles.dateButtonContainerStyle}>
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
