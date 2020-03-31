import React, { useState, useRef, useCallback, useMemo } from "react";
import { View, FlatList, Text, StyleSheet, ActivityIndicator, LayoutAnimation, UIManager, findNodeHandle } from 'react-native';
import { MeasureUnitType, DataSourceType } from "@data-at-hand/core/measure/DataSourceSpec";
import { ExplorationAction, setTouchElementInfo, createGoToBrowseDayAction, InteractionType, setHighlightFilter } from "@state/exploration/interaction/actions";
import { connect } from "react-redux";
import { ReduxAppState } from "@state/types";
import { Dispatch } from "redux";
import { DataSourceBrowseData } from "@core/exploration/data/types";
import { DataSourceChartFrame } from "@components/exploration/DataSourceChartFrame";
import { explorationInfoHelper } from "@core/exploration/ExplorationInfoHelper";
import { TouchingElementInfo, inferIntraDayDataSourceType, TouchingElementValueType } from "@core/exploration/types";
import { DateTimeHelper } from "@data-at-hand/core/utils/time";
import { format, startOfDay, addSeconds } from "date-fns";
import { StyleTemplates } from "@style/Styles";
import { Sizes } from "@style/Sizes";
import Colors from "@style/Colors";
import commaNumber from 'comma-number';
import unitConvert from 'convert-units';
import { TouchableHighlight } from "react-native-gesture-handler";
import { SvgIcon, SvgIconType } from "@components/common/svg/SvgIcon";
import { DataServiceManager } from "@measure/DataServiceManager";
import { HighlightFilterPanel } from "@components/exploration/HighlightFilterPanel";
import { HighlightFilter, ParameterType } from "@data-at-hand/core/exploration/ExplorationInfo";

const listItemHeightNormal = 52
const listItemHeightTall = 70

const styles = StyleSheet.create({
    listItemStyle: {
        ...StyleTemplates.flexHorizontalCenteredListContainer,
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
    highlightFilter?: HighlightFilter,
    highlightedDate?: number,
    getToday?: () => Date,
    dispatchExplorationAction?: (action: ExplorationAction) => void
}

interface State {
    today: number,
}

class BrowseRangeMainPanel extends React.PureComponent<Props, State>{

    constructor(props: Props) {
        super(props)

        this.state = {
            today: DateTimeHelper.toNumberedDateFromDate(props.getToday())
        }
    }


    componentDidUpdate(prevProps: Props) {
        if (prevProps.highlightFilter !== this.props.highlightFilter) {
            LayoutAnimation.configureNext(
                LayoutAnimation.create(
                    500, LayoutAnimation.Types.easeInEaseOut, "opacity")
            )
        }
    }

    private readonly onListElementClick = (date: number) => {
        this.props.dispatchExplorationAction(createGoToBrowseDayAction(InteractionType.TouchOnly, inferIntraDayDataSourceType(this.props.source), date))
    }

    private readonly onListElementLongPressIn = (date: number, element: TouchingElementInfo) => {
        this.props.dispatchExplorationAction(setTouchElementInfo(element))
    }

    private readonly onListElementLongPressOut = (date: number) => {
        this.props.dispatchExplorationAction(setTouchElementInfo(null))
    }

    private readonly onDiscardFilter = () => {
        this.props.dispatchExplorationAction(setHighlightFilter(InteractionType.TouchOnly, null))
    }

    private readonly onFilterModified = (newFilter: HighlightFilter) => {
        this.props.dispatchExplorationAction(setHighlightFilter(InteractionType.TouchOnly, newFilter))
    }

    private getItemLayout = (_: any, index: number) => {
        const height = (this.props.source === DataSourceType.HoursSlept || this.props.source === DataSourceType.SleepRange) ? listItemHeightTall : listItemHeightNormal
        return { length: height, offset: height * index, index }
    }

    private renderItem = ({ item }: { item: any }) => <Item date={item["numberedDate"]}
        today={this.state.today} item={item} type={this.props.source}
        unitType={this.props.measureUnitType}
        isHighlighted={item["numberedDate"] === this.props.highlightedDate}
        onClick={this.onListElementClick}
        onLongPressIn={this.onListElementLongPressIn}
        onLongPressOut={this.onListElementLongPressOut}
    />

    render() {
        if (this.props.data != null) {
            const sourceRangedData = this.props.data as DataSourceBrowseData
            const dataList: Array<any> = (this.props.source === DataSourceType.Weight ? sourceRangedData.data.logs : sourceRangedData.data).slice(0)
            dataList.sort((a: any, b: any) => b["numberedDate"] - a["numberedDate"])

            return <>
                {
                    this.props.highlightFilter != null ? <HighlightFilterPanel
                        filter={this.props.highlightFilter}
                        highlightedDays={this.props.data.highlightedDays}
                        onDiscardFilterPressed={this.onDiscardFilter}
                        onFilterModified={this.onFilterModified}
                    /> : null
                }
                <DataSourceChartFrame data={sourceRangedData}
                    filter={this.props.highlightFilter}
                    highlightedDays={sourceRangedData.highlightedDays}
                    measureUnitType={this.props.measureUnitType}
                    showToday={false}
                    flat={true}
                    showHeader={false}
                />
                {
                    dataList.length > 0 && <FlatList style={StyleTemplates.fillFlex}
                        data={dataList}
                        renderItem={this.renderItem}
                        getItemLayout={this.getItemLayout}
                        keyExtractor={item => item["id"] || item["numberedDate"].toString()}
                    />
                }
                {
                    dataList.length === 0 && <View style={StyleTemplates.contentVerticalCenteredContainer}>
                        <Text style={styles.noItemIndicatorStyle}>No data during this range.</Text>
                    </View>
                }
            </>
        } else return <ActivityIndicator />
    }
}


function mapDispatchToProps(dispatch: Dispatch, ownProps: Props): Props {
    return {
        ...ownProps,
        dispatchExplorationAction: (action) => dispatch(action)
    }
}

function mapStateToProps(appState: ReduxAppState, ownProps: Props): Props {

    let highlightedDate: number = null
    if (appState.explorationState.touchingElement) {
        const date = explorationInfoHelper.getParameterValueOfParams<number>(appState.explorationState.touchingElement.params, ParameterType.Date)
        if (date != null) {
            highlightedDate = date
        }
    }

    return {
        ...ownProps,
        source: explorationInfoHelper.getParameterValue(appState.explorationDataState.info, ParameterType.DataSource),
        data: appState.explorationDataState.data,
        measureUnitType: appState.settingsState.unit,
        isLoadingData: appState.explorationDataState.isBusy,
        highlightedDate,
        highlightFilter: appState.explorationState.info.highlightFilter,
        getToday: DataServiceManager.instance.getServiceByKey(appState.settingsState.serviceKey).getToday
    }
}


const connected = connect(mapStateToProps, mapDispatchToProps)(BrowseRangeMainPanel)

export { connected as BrowseRangeMainPanel }


const Item = React.memo((prop: {
    date: number,
    item: any,
    today: number,
    type: DataSourceType,
    unitType: MeasureUnitType,
    isHighlighted: boolean,
    onClick: (date: number) => void,
    onLongPressIn: (date: number, touchingElement: TouchingElementInfo) => void,
    onLongPressOut: (date: number) => void
}) => {
    const dateString = useMemo(() => {
        var dateString
        if (prop.date === prop.today) {
            dateString = "Today"
        } else if (prop.today - prop.date === 1) {
            dateString = 'Yesterday'
        } else dateString = format(DateTimeHelper.toDate(prop.date), "MMM dd, eee")
        return dateString
    }, [prop.date, prop.today])

    const listItemStyle = useMemo(() => {
        if (prop.type === DataSourceType.SleepRange || prop.type === DataSourceType.HoursSlept) return { ...styles.listItemStyle, height: listItemHeightTall }
        else return { ...styles.listItemStyle, height: listItemHeightNormal }
    }, [prop.type])

    const valueView = useMemo(() => {
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
        return valueElement
    }, [prop.type, prop.item.bedTimeDiffSeconds, prop.item.wakeTimeDiffSeconds, prop.item.value])


    const [isInLongPress, setInLongPress] = useState(false)

    const elmRef = useRef(null)

    const onLongPress = useCallback((event) => {
        if (prop.onLongPressIn) {
            UIManager.measureInWindow(findNodeHandle(elmRef.current), (x, y, width, height) => {
                setInLongPress(true);
                prop.onLongPressIn(prop.date, {
                    touchId: Date.now().toString(),
                    elementBoundInScreen: { x, y, width, height },
                    params: [
                        { parameter: ParameterType.DataSource, value: prop.type },
                        { parameter: ParameterType.Date, value: prop.date }
                    ],
                    valueType: TouchingElementValueType.DayValue,
                    value: prop.type === DataSourceType.SleepRange ? { value: prop.item.bedTimeDiffSeconds, value2: prop.item.wakeTimeDiffSeconds }
                        : (prop.type === DataSourceType.HoursSlept ? prop.item.lengthInSeconds : prop.item.value)
                })
            })
        } else {
            setInLongPress(true);
        }
    }, [elmRef.current, prop.onLongPressIn, setInLongPress, prop.type, prop.date, prop.item])

    const onPress = useCallback(() => {
        prop.onClick(prop.date)
    }, [prop.onClick, prop.date])

    const onPressOut = useCallback(() => {
        if (isInLongPress === true) {
            console.log("long press out")
            setInLongPress(false)
            prop.onLongPressOut && prop.onLongPressOut(prop.date)
        } else {
            console.log("click press out")
        }
    }, [isInLongPress, setInLongPress, prop.onLongPressOut, prop.date])

    return <TouchableHighlight activeOpacity={0.95}
        ref={elmRef}
        onLongPress={onLongPress}
        onPress={onPress}
        onPressOut={onPressOut}>

        <View style={listItemStyle}>
            <Text style={prop.today === prop.date ? styles.listItemDateTodayStyle : styles.listItemDateStyle}>{dateString}</Text>
            {
                valueView
            }
            <SvgIcon type={SvgIconType.ArrowRight} color={Colors.textGray} />
            {
                prop.isHighlighted === true && <View style={styles.listItemHighlightStyle} />
            }
        </View></TouchableHighlight>
})