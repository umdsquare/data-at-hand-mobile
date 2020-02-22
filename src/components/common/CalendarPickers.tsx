import React from 'react';
import { Calendar } from 'react-native-calendars';
import Colors from '../../style/Colors';
import { format, set, addDays, getDay, startOfWeek, endOfWeek, getMonth, getYear } from 'date-fns';
import { View, StyleSheet, Text } from 'react-native';
import { Button } from 'react-native-elements';
import { Sizes } from '../../style/Sizes';
import { SvgIcon, SvgIconType } from './svg/SvgIcon';
import { useSelector, connect } from 'react-redux';
import { ReduxAppState } from '../../state/types';
import { DataServiceManager } from '../../system/DataServiceManager';
import { Dispatch } from 'redux';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const calendarTheme = {
    selectedDayBackgroundColor: Colors.accent,
    selectedDayTextColor: 'white',
    arrowColor: Colors.textColorLight,
    todayTextColor: Colors.today,
    textDayFontSize: 13,
    textDayFontWeight: '500',
    textMonthFontWeight: 'bold',
    textMonthFontSize: 18,
    dayTextColor: Colors.textColorLight,
    monthTextColor: Colors.chartDimmedText,
    'stylesheet.calendar.header': {
        header: {
            marginBottom: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        arrow: {
            padding: 22
        }
    }
}

const calendarProps = {
    theme: calendarTheme,
    renderArrow: (direction: 'left' | 'right') => {
        switch (direction) {
            default:
            case 'left':
                return <SvgIcon type={SvgIconType.ArrowLeft} color={'gray'} />
            case 'right':
                return <SvgIcon type={SvgIconType.ArrowRight} color={'gray'} />
        }
    },
}

function formatDate(date: Date): string { return format(date, "yyyy-MM-dd") }
function parseDate(calendarPickerDateObject: any): Date { return set(new Date(), { year: calendarPickerDateObject.year, month: calendarPickerDateObject.month - 1, date: calendarPickerDateObject.day }) }

export const DatePicker = (props: { selectedDay?: Date, earliedPossibleDay?: Date, latestPossibleDay?: Date, ghostRange?: [Date, Date], onDayPress?: (date: Date) => void }) => {
    
    const serviceKey = useSelector((appState:ReduxAppState) => appState.settingsState.serviceKey)
    const today = DataServiceManager.instance.getServiceByKey(serviceKey).getToday()

    const markedDates = {}
    if (props.selectedDay) {
        markedDates[formatDate(props.selectedDay)] = { selected: true }
    }

    /*
    if(props.ghostRange){
        markedDates[formatDate(props.ghostRange[0])] = {startingDay: true, color: 'gray'}

        markedDates[formatDate(props.ghostRange[1])] = {endingDay: true, color: 'gray'}
    }*/

    return <Calendar
        {...calendarProps}
        current={props.selectedDay || today}
        markedDates={markedDates}
        minDate={props.earliedPossibleDay}
        maxDate={props.latestPossibleDay}
        onDayPress={(d) => {
            props.onDayPress(parseDate(d))
        }}
    />
}

const selectedWeekRangeMarkInfoBase = {
    selected: true,
    color: Colors.accent
}

export const WeekPicker = (props: { selectedWeekFirstDay?: Date, onWeekSelected?: (weekFirstDay: Date, weekEndDay: Date) => void }) => {
    const serviceKey = useSelector((appState:ReduxAppState) => appState.settingsState.serviceKey)
    const today = DataServiceManager.instance.getServiceByKey(serviceKey).getToday()
    
    const markedDates = {}

    if (props.selectedWeekFirstDay) {
        for (let i = 0; i < 7; i++) {
            const date = addDays(props.selectedWeekFirstDay, i)
            if (i === 0) {
                markedDates[formatDate(date)] = { ...selectedWeekRangeMarkInfoBase, startingDay: true }
            } else if (i === 6) {
                markedDates[formatDate(date)] = { ...selectedWeekRangeMarkInfoBase, endingDay: true }
            } else {
                markedDates[formatDate(date)] = selectedWeekRangeMarkInfoBase
            }
        }
    }


    return <Calendar
        {...calendarProps}
        current={props.selectedWeekFirstDay || today}
        markedDates={markedDates}
        markingType={'period'}
        onDayPress={(d) => {
            const selectedDate = parseDate(d)
            const startDayOfWeek = getDay(props.selectedWeekFirstDay)
            const startDayOfSelectedWeek = startOfWeek(selectedDate, { weekStartsOn: startDayOfWeek as any })
            const endDayOfSelectedWeek = endOfWeek(selectedDate, { weekStartsOn: startDayOfWeek as any })
            if (props.onWeekSelected != null) {
                props.onWeekSelected(startDayOfSelectedWeek, endDayOfSelectedWeek)
            }
        }}
    />
}

const monthPickerStyle = StyleSheet.create({
    pickerContainerStyle: {
        flexDirection: 'column',
    },
    headerStyle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomColor: "#00000030",
        borderBottomWidth: 1,
        paddingBottom: 12,
        paddingTop: 12
    },

    arrowButtonContainerStyle: {

    },

    titleStyle: {
        color: calendarTheme.monthTextColor,
        fontWeight: calendarTheme.textMonthFontWeight as any,
        fontSize: calendarTheme.textMonthFontSize
    },
    monthRowStyle: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center'
    },
    monthButtonStyle: {
        flex: 0.22,
        height: 50
    },
    monthButtonSelectedStyle: {
        borderColor: Colors.accent,
        borderRadius: 9,
        borderWidth: 2.5
    },

    monthButtonTitleStyle: {
        fontSize: Sizes.normalFontSize,
        color: Colors.textColorLight,
        fontWeight: 'bold'
    }
})

interface MonthPickerProps {
    getToday?: ()=>Date,
    selectedMonth: Date,
    onMonthSelected?: (month: Date) => void
}

interface MonthPickerState {
    currentYear: number
    selectedMonth: Date
}

class MonthPicker extends React.Component<MonthPickerProps, MonthPickerState>{

    constructor(props: MonthPickerProps) {
        super(props)

        const selectedMonth = props.selectedMonth || props.getToday()

        this.state = {
            currentYear: getYear(selectedMonth),
            selectedMonth: props.selectedMonth
        }
    }

    prevYear = () => {
        this.setState({
            ...this.state,
            currentYear: this.state.currentYear - 1
        })
    }

    nextYear = () => {
        this.setState({
            ...this.state,
            currentYear: this.state.currentYear + 1
        })
    }

    onMonthPressed = (month: number) => {
        const monthDate = set(this.props.getToday(), { year: this.state.currentYear, month: month })
        this.setState({
            ...this.state,
            selectedMonth: monthDate
        })
        if (this.props.onMonthSelected) {
            this.props.onMonthSelected(monthDate)
        }
    }

    render() {

        return <View style={monthPickerStyle.pickerContainerStyle}>
            <View style={monthPickerStyle.headerStyle}>
                <Button
                    type="clear"
                    icon={<SvgIcon type={SvgIconType.ArrowLeft} color="gray" />}
                    onPress={this.prevYear}
                    containerStyle={monthPickerStyle.arrowButtonContainerStyle}
                />
                <Text style={monthPickerStyle.titleStyle}>{this.state.currentYear}</Text>
                <Button
                    type="clear"
                    icon={<SvgIcon type={SvgIconType.ArrowRight} color="gray" />}
                    onPress={this.nextYear}
                    containerStyle={monthPickerStyle.arrowButtonContainerStyle}
                />
            </View>
            {
                [0, 1, 2, 3].map(row => <View key={"row_" + row} style={monthPickerStyle.monthRowStyle}>
                    {
                        [0, 1, 2].map(month => month + (row * 3)).map(month => {
                            const isSelected = this.state.currentYear === getYear(this.state.selectedMonth) && getMonth(this.state.selectedMonth) === month
                            return <Button type="clear"
                                titleStyle={{
                                    ...monthPickerStyle.monthButtonTitleStyle,
                                    color: isSelected === true ? Colors.accent : Colors.textColorLight
                                }}
                                buttonStyle={isSelected === true ? monthPickerStyle.monthButtonSelectedStyle : {}}
                                containerStyle={monthPickerStyle.monthButtonStyle} key={month} title={monthNames[month].toUpperCase()}
                                onPress={() => isSelected === false && this.onMonthPressed(month)}
                            />
                        })
                    }
                </View>)
            }
        </View>
    }
}


function mapDispatchToProps(dispatch: Dispatch, ownProps: MonthPickerProps): MonthPickerProps {
    return {
        ...ownProps,
    }
}

function mapStateToProps(appState: ReduxAppState, ownProps: MonthPickerProps): MonthPickerProps {
    return {
        ...ownProps,
        getToday: DataServiceManager.instance.getServiceByKey(appState.settingsState.serviceKey).getToday
    }
}


const connected = connect(mapStateToProps, mapDispatchToProps)(MonthPicker)

export { connected as MonthPicker }