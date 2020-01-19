import React from "react";
import { View, StyleSheet, Text } from "react-native";
import Colors from "../../style/Colors";
import { SpeechAffordanceIndicator } from "./SpeechAffordanceIndicator";
import { Sizes } from "../../style/Sizes";
import Dash from 'react-native-dash';
import { Button } from "react-native-elements";
import { format, isToday, startOfDay, endOfDay, isYesterday, differenceInCalendarDays, isSameMonth, isFirstDayOfMonth, isLastDayOfMonth, isMonday, isSunday } from "date-fns";

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
    }
})

enum PeriodLevel {
    Day, Week, Month
}

interface Props {
    from: Date,
    to: Date,
    onRangeChanged?: (from: Date, to: Date) => void
}

interface State {
    semanticPeriodCaptured: boolean,
    numDays: number,
    level?: PeriodLevel,
    periodName?: string,
}

export class DateRangeBar extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props)
        this.state = this.processRange(props.from, props.to)
    }

    private processRange(from: Date, to: Date): State{
        const numDays = -differenceInCalendarDays(from, to) + 1
        if(isSameMonth(from, to) === true && isFirstDayOfMonth(from)===true && isLastDayOfMonth(to)){
            //month
            return {
                ...this.state,
                semanticPeriodCaptured: true,
                numDays: numDays,
                level: PeriodLevel.Month,
                periodName: format(from, "MMM yyyy")
            }
        }else if(numDays === 7 && (isMonday(from) || isSunday(from))){
            return {
                ...this.state,
                semanticPeriodCaptured: true,
                numDays: numDays,
                level: PeriodLevel.Week,
                periodName: "Week of " + format(from, "MMM dd")
            }
        }else{
            return {
                ...this.state,
                semanticPeriodCaptured: false,
                numDays: numDays,
                level: null,
                periodName: null
            }
        }
    }

    componentDidUpdate(prevProps: Props) {
        if (this.props.from !== prevProps.from || this.props.to !== prevProps.to) {
            this.setState(this.processRange(this.props.from, this.props.to))
        }
    }

    render() {
        return <View style={styles.containerStyle}>
            <DateButton date={this.props.from} />
            <View style={styles.midViewContainerStyle} >
                <Dash style={styles.dashViewStyle} dashGap={4} dashColor="gray" dashLength={3} dashThickness={3} dashStyle={styles.dashLineStyle} />
                <View style={styles.midViewFooterContainerStyle}>

                    {
                        this.state.semanticPeriodCaptured === true? (
                            <Button title={this.state.periodName} buttonStyle={styles.periodButtonStyle} titleStyle={styles.periodButtonTitleStyle} />
                        ): (
                            <Text style={styles.midViewDescriptionTextStyle}>{this.state.numDays}</Text>
                        )
                    }
                    
                </View>
            </View>
            <DateButton date={this.props.to} />
        </View>
    }
}

const DateButton = (props: { date: Date }) => {
    const dateString = format(props.date, "MMM dd, yyyy")
    const subText = isToday(props.date) === true ? 'Today' : (isYesterday(props.date) === true ? "Yesterday" : format(props.date, "EEEE"))
    return <View style={styles.dateButtonContainerStyle}>
        <View style={styles.dateButtonDatePartStyle}>
            <Text style={styles.dateButtonDateTextStyle}>{dateString}</Text>
            <View style={styles.dateButtonIndicatorContainerStyle}>
                <SpeechAffordanceIndicator />
            </View>
        </View>
        <Text style={styles.midViewDescriptionTextStyle}>
            {subText}
        </Text>
    </View>
}