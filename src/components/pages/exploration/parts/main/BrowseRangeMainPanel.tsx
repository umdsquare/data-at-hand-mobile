import React, { useState } from "react";
import { View, FlatList, Text, StyleSheet, ActivityIndicator, LayoutAnimation, UIManager, findNodeHandle } from 'react-native';
import { MeasureUnitType, DataSourceType } from "../../../../../measure/DataSourceSpec";
import { ExplorationAction, setTouchElementInfo, createGoToBrowseDayAction, InteractionType } from "../../../../../state/exploration/interaction/actions";
import { connect } from "react-redux";
import { ReduxAppState } from "../../../../../state/types";
import { Dispatch } from "redux";
import { OverviewSourceRow } from "../../../../../core/exploration/data/types";
import { DataSourceChartFrame } from "../../../../exploration/DataSourceChartFrame";
import { explorationInfoHelper } from "../../../../../core/exploration/ExplorationInfoHelper";
import { ParameterType, TouchingElementInfo, inferIntraDayDataSourceType } from "../../../../../core/exploration/types";
import { DateTimeHelper } from "../../../../../time";
import { format, startOfDay, addSeconds } from "date-fns";
import { StyleTemplates } from "../../../../../style/Styles";
import { Sizes } from "../../../../../style/Sizes";
import Colors from "../../../../../style/Colors";
import { Icon } from "react-native-elements";
import commaNumber from 'comma-number';
import unitConvert from 'convert-units';
import { TouchableHighlight } from "react-native-gesture-handler";

const styles = StyleSheet.create({
    listItemStyle: {
        ...StyleTemplates.flexHorizontalCenteredListContainer,
        minHeight: 52,
        backgroundColor: '#fdfdfd',
        paddingLeft: Sizes.horizontalPadding,
        paddingRight: Sizes.horizontalPadding,
        borderBottomColor: "#00000015",
        borderBottomWidth: 1
    },

    listItemHighlightStyle: {
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        borderColor: Colors.accent + "60",
        borderWidth: 3
    },


    listItemDateStyle: {
        color: Colors.textGray,
        width: 120
    },

    listItemDateTodayStyle: {
        color: Colors.today,
        fontWeight: '500',
        width: 120
    },

    listItemValueContainerStyle: {
        ...StyleTemplates.fillFlex,
        paddingBottom: 12,
        paddingTop: 12
    },

    listItemValueDigitStyle: {
        fontSize: 16
    },

    listItemValueUnitStyle: {
        fontSize: 14,
        color: Colors.textGray
    },
    noItemIndicatorStyle: { alignSelf: 'center', color: Colors.textColorLight }

})

interface Props {
    isLoadingData?: boolean,
    source?: DataSourceType,
    data?: any,
    measureUnitType?: MeasureUnitType,
    touchingElementInfo?: TouchingElementInfo,
    dispatchExplorationAction?: (action: ExplorationAction) => void
}

class BrowseRangeMainPanel extends React.Component<Props>{

    componentDidUpdate(prevProps: Props) {
        if (prevProps.isLoadingData !== this.props.isLoadingData) {
            //LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        }
    }

    onListElementClick = (date: number) => {
        this.props.dispatchExplorationAction(createGoToBrowseDayAction(InteractionType.TouchOnly, inferIntraDayDataSourceType(this.props.source), date))
    }

    onListElementLongPressIn = (date: number, element: TouchingElementInfo) => {
        this.props.dispatchExplorationAction(setTouchElementInfo(element))
    }

    onListElementLongPressOut = (date: number) => {
        this.props.dispatchExplorationAction(setTouchElementInfo(null))
    }

    render() {
        if (this.props.data != null) {
            const today = DateTimeHelper.toNumberedDateFromDate(new Date())
            const sourceRangedData = this.props.data as OverviewSourceRow
            const dataList: Array<any> = (this.props.source === DataSourceType.Weight ? sourceRangedData.data.logs : sourceRangedData.data).slice(0)
            dataList.sort((a: any, b: any) => b["numberedDate"] - a["numberedDate"])

            let highlightedDate: number = null
            if (this.props.touchingElementInfo) {
                const dataSource = explorationInfoHelper.getParameterValueOfParams<DataSourceType>(this.props.touchingElementInfo.params, ParameterType.DataSource)
                const date = explorationInfoHelper.getParameterValueOfParams<number>(this.props.touchingElementInfo.params, ParameterType.Date)
                if (dataSource === this.props.source && date != null) {
                    highlightedDate = date
                }
            }

            return <View style={StyleTemplates.fillFlex}>
                <DataSourceChartFrame data={sourceRangedData}
                    measureUnitType={this.props.measureUnitType}
                    showToday={false}
                    flat={true}
                    showHeader={false}
                />
                {
                    dataList.length > 0 && <FlatList style={StyleTemplates.fillFlex} data={dataList}
                        renderItem={(entry) => <Item date={entry.item["numberedDate"]}
                            today={today} item={entry.item} type={this.props.source}
                            unitType={this.props.measureUnitType}
                            isHighlighted={entry.item["numberedDate"] === highlightedDate}
                            onClick={this.onListElementClick}
                            onLongPressIn={this.onListElementLongPressIn}
                            onLongPressOut={this.onListElementLongPressOut}
                        />}
                        keyExtractor={item => item["id"] || item["numberedDate"].toString()}
                    />
                }
                {
                    dataList.length === 0 && <View style={StyleTemplates.contentVerticalCenteredContainer}>
                        <Text style={styles.noItemIndicatorStyle}>No data during this range.</Text>
                    </View>
                }
            </View>
        } else return <View style={StyleTemplates.fillFlex}>
            <ActivityIndicator />
        </View>
    }
}


function mapDispatchToProps(dispatch: Dispatch, ownProps: Props): Props {
    return {
        ...ownProps,
        dispatchExplorationAction: (action) => dispatch(action)
    }
}

function mapStateToProps(appState: ReduxAppState, ownProps: Props): Props {
    return {
        ...ownProps,
        source: explorationInfoHelper.getParameterValue(appState.explorationDataState.info, ParameterType.DataSource),
        data: appState.explorationDataState.data,
        measureUnitType: appState.settingsState.unit,
        isLoadingData: appState.explorationDataState.isBusy,
        touchingElementInfo: appState.explorationState.touchingElement
    }
}


const connected = connect(mapStateToProps, mapDispatchToProps)(BrowseRangeMainPanel)

export { connected as BrowseRangeMainPanel }


const Item = (prop: {
    date: number,
    item: any,
    today: number,
    type: DataSourceType,
    unitType: MeasureUnitType,
    isHighlighted: boolean,
    onClick: (date) => void,
    onLongPressIn: (date, touchingElement: TouchingElementInfo) => void,
    onLongPressOut: (date) => void
}) => {
    var dateString
    if (prop.date === prop.today) {
        dateString = "Today"
    } else if (prop.today - prop.date === 1) {
        dateString = 'Yesterday'
    } else dateString = format(DateTimeHelper.toDate(prop.date), "MMM dd, eee")

    let valueElement: any
    switch (prop.type) {
        case DataSourceType.StepCount:
            valueElement = <Text style={styles.listItemValueContainerStyle}>
                <Text style={styles.listItemValueDigitStyle}>{commaNumber(prop.item.value)}</Text>
                <Text style={styles.listItemValueUnitStyle}> steps</Text>
            </Text>
            break;
        case DataSourceType.HeartRate:
            valueElement = <Text style={styles.listItemValueContainerStyle}>
                <Text style={styles.listItemValueDigitStyle}>{prop.item.value}</Text>
                <Text style={styles.listItemValueUnitStyle}> bpm</Text>
            </Text>
            break;
        case DataSourceType.Weight:
            let valueText
            let unit
            switch (prop.unitType) {
                case MeasureUnitType.US:
                    valueText = unitConvert(prop.item.value).from('kg').to('lb').toFixed(1)
                    unit = ' lb'
                    break;

                case MeasureUnitType.Metric:
                default:
                    valueText = prop.item.value.toFixed(1)
                    unit = ' kg'
                    break;
            }

            valueElement = <Text style={styles.listItemValueContainerStyle}>
                <Text style={styles.listItemValueDigitStyle}>{valueText}</Text>
                <Text style={styles.listItemValueUnitStyle}>{unit}</Text>
            </Text>
            break;

        case DataSourceType.HoursSlept:
        case DataSourceType.SleepRange:
            const pivot = startOfDay(DateTimeHelper.toDate(prop.date))

            const actualBedTime = addSeconds(pivot, Math.round(prop.item.bedTimeDiffSeconds))
            const actualWakeTime = addSeconds(pivot, Math.round(prop.item.wakeTimeDiffSeconds))

            const rangeText = format(actualBedTime, 'hh:mm a').toLowerCase() + " - " + format(actualWakeTime, 'hh:mm a').toLowerCase()

            const lengthHr = Math.floor(prop.item.lengthInSeconds / 3600)
            let lengthMin = Math.floor((prop.item.lengthInSeconds % 3600) / 60)
            const lengthSec = prop.item.lengthInSeconds % 60
            if (lengthSec > 30) {
                lengthMin++
            }

            const durationFormat = []
            if (lengthHr > 0) {
                durationFormat.push({ type: 'value', text: lengthHr })
                durationFormat.push({ type: 'unit', text: " hr" })
            }
            durationFormat.push({ type: "value", text: lengthHr > 0 ? (" " + lengthMin) : lengthMin })
            durationFormat.push({ type: "unit", text: " min" })


            valueElement = <View style={styles.listItemValueContainerStyle}>
                <Text style={{ marginBottom: 8, fontSize: Sizes.smallFontSize, color: Colors.textColorLight }}>{rangeText}</Text>
                <Text>
                    {
                        durationFormat.map((f, i) => <Text key={i}
                            style={f.type === 'value' ? styles.listItemValueDigitStyle : styles.listItemValueUnitStyle}>
                            {f.text}
                        </Text>)
                    }
                </Text>
            </View>
            break;
    }

    const [isInLongPress, setInLongPress] = useState(false)

    let elmRef

    return <TouchableHighlight activeOpacity={0.95}
        ref={ref => elmRef = ref}
        onLongPress={(event) => {
            if (prop.onLongPressIn) {
                UIManager.measureInWindow(findNodeHandle(elmRef), (x, y, width, height) => {
                    setInLongPress(true);
                    prop.onLongPressIn(prop.date, {
                        touchId: Date.now().toString(),
                        elementBoundInScreen: { x, y, width, height },
                        params: [
                            { parameter: ParameterType.DataSource, value: prop.type },
                            { parameter: ParameterType.Date, value: prop.date }
                        ]
                    })
                })
            } else {
                setInLongPress(true);
            }
        }}
        onPress={(ev) => { console.log("click"); prop.onClick(prop.date) }}
        onPressOut={(ev) => {
            if (isInLongPress === true) {
                console.log("long press out")
                setInLongPress(false)
                prop.onLongPressOut && prop.onLongPressOut(prop.date)
            } else {
                console.log("click press out")
            }
        }}><View style={styles.listItemStyle}>
            <Text style={prop.today === prop.date ? styles.listItemDateTodayStyle : styles.listItemDateStyle}>{dateString}</Text>
            {
                valueElement
            }
            <Icon type="materialicons" name="keyboard-arrow-right" color={Colors.textGray} />
            {
                prop.isHighlighted === true && <View style={styles.listItemHighlightStyle} />
            }
        </View></TouchableHighlight>
}