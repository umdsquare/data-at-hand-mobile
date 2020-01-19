import React from 'react';
import { Calendar, CalendarList, Agenda } from 'react-native-calendars';
import Colors from '../../style/Colors';
import { format, parseISO, parse, setDate, set, addDays, getDay, startOfWeek, endOfWeek } from 'date-fns';

const calendarTheme = {
    selectedDayBackgroundColor: Colors.accent,
    selectedDayTextColor: 'white',
    arrowColor: Colors.textColorLight,
    todayTextColor: Colors.today,
    textDayFontSize: 13,
    textDayFontWeight: '500',
    textMonthFontWeight: 'bold',
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

function formatDate(date: Date): string { return format(date, "yyyy-MM-dd") }
function parseDate(calendarPickerDateObject: any): Date {return set(new Date(), { year: calendarPickerDateObject.year, month: calendarPickerDateObject.month - 1, date: calendarPickerDateObject.day })}

export const DatePicker = (props: { selectedDay?: Date, earliedPossibleDay?: Date, latestPossibleDay?: Date, ghostRange?: [Date, Date], onDayPress?: (date: Date) => void }) => {
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
        theme={calendarTheme}
        current={props.selectedDay || new Date()}
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

export const WeekPicker = (props: { selectedWeekFirstDay?: Date, onWeekSelected?: (weekFirstDay: Date, weekEndDay: Date)=>void }) => {
    const markedDates = {}

    if (props.selectedWeekFirstDay) {
        for (let i = 0; i < 7; i++) {
            const date = addDays(props.selectedWeekFirstDay, i)
            if(i === 0){
                markedDates[formatDate(date)] = {...selectedWeekRangeMarkInfoBase, startingDay: true}
            }else if(i === 6){
                markedDates[formatDate(date)] = {...selectedWeekRangeMarkInfoBase, endingDay: true}
            }else{
                markedDates[formatDate(date)] = selectedWeekRangeMarkInfoBase
            }
        }
    }


    return <Calendar
        theme={calendarTheme}
        markedDates={markedDates}
        markingType={'period'}
        onDayPress={(d)=>{
            const selectedDate = parseDate(d)
            const startDayOfWeek = getDay(props.selectedWeekFirstDay)
            const startDayOfSelectedWeek = startOfWeek(selectedDate, {weekStartsOn: startDayOfWeek as any})
            const endDayOfSelectedWeek = endOfWeek(selectedDate, {weekStartsOn: startDayOfWeek as any})
            if(props.onWeekSelected != null){
                props.onWeekSelected(startDayOfSelectedWeek, endDayOfSelectedWeek)
            }
        }}
    />
}