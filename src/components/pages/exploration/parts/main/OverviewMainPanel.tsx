import { createGoToBrowseRangeAction, InteractionType, memoUIStatus, ExplorationAction, createGoToBrowseDayAction, setHighlightFilter } from "@state/exploration/interaction/actions";
import React from "react";
import { connect } from "react-redux";
import { ReduxAppState } from "@state/types";
import { FlatList, View, LayoutAnimation } from "react-native";
import { DataSourceChartFrame } from "@components/exploration/DataSourceChartFrame";
import { OverviewData } from "@core/exploration/data/types";
import { MeasureUnitType, DataSourceType } from "@measure/DataSourceSpec";
import { Dispatch } from "redux";
import { Sizes } from "@style/Sizes";
import { DateTimeHelper } from "@utils/time";
import { inferIntraDayDataSourceType, HighlightFilter } from "@core/exploration/types";
import { DataServiceManager } from "@measure/DataServiceManager";
import { HighlightFilterPanel } from "@components/exploration/HighlightFilterPanel";
import { DataSourceManager } from "@measure/DataSourceManager";
import { StyleTemplates } from "@style/Styles";

const separatorStyle = { height: Sizes.verticalPadding }

interface Props {
    data?: OverviewData,
    isLoading?: boolean,
    measureUnitType?: MeasureUnitType,
    overviewScrollY?: any,
    highlightFilter?: HighlightFilter,
    getToday?: () => Date,
    dispatchAction?: (action: ExplorationAction) => void
}

class OverviewMainPanel extends React.PureComponent<Props> {

    private _listRef = React.createRef<FlatList<any>>()

    currentListScrollOffset: number

    constructor(props) {
        super(props)
    }

    componentDidMount() {
        console.log("mount overview main panel.")
        if (this._listRef.current != null && this.props.overviewScrollY != null) {
            requestAnimationFrame(() => {
                this._listRef.current.scrollToOffset({ offset: this.props.overviewScrollY, animated: false })
            })
        }
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.highlightFilter !== this.props.highlightFilter) {
            LayoutAnimation.configureNext(
                LayoutAnimation.create(
                    500, LayoutAnimation.Types.easeInEaseOut, "opacity")
            )

            if (prevProps.highlightFilter == null && this.props.highlightFilter != null) {
                this._listRef.current?.scrollToIndex({
                    animated: true,
                    index: this.props.data.sourceDataList.findIndex(d => d.source === this.props.highlightFilter.dataSource)
                })
            }
        }
    }

    componentWillUnmount() {
        console.log("unmount overview main panel.")
        this.props.dispatchAction(memoUIStatus("overviewScrollY", this.currentListScrollOffset))
    }

    private readonly onDiscardFilter = () => {
        this.props.dispatchAction(setHighlightFilter(InteractionType.TouchOnly, null))
    }

    private readonly onFilterModified = (newFilter: HighlightFilter) => {
        this.props.dispatchAction(setHighlightFilter(InteractionType.TouchOnly, newFilter))
    }


    private readonly Separator = () => {
        return <View style={separatorStyle} />
    }

    private readonly onHeaderPressed = (source: DataSourceType) => {
        this.props.dispatchAction(createGoToBrowseRangeAction(InteractionType.TouchOnly, source))
    }

    private readonly onTodayPressed = (source: DataSourceType) => {
        this.props.dispatchAction(createGoToBrowseDayAction(InteractionType.TouchOnly,
            inferIntraDayDataSourceType(source), DateTimeHelper.toNumberedDateFromDate(this.props.getToday())))
    }

    private readonly onScroll = (event) => {
        const scrollY = event.nativeEvent.contentOffset.y
        this.currentListScrollOffset = scrollY
    }

    private readonly renderItem = ({ item }) => <DataSourceChartFrame key={item.source.toString()}
        data={item}
        filter={this.props.highlightFilter}
        highlightedDays={this.props.data.highlightedDays}
        measureUnitType={this.props.measureUnitType}
        onHeaderPressed={this.onHeaderPressed}
        onTodayPressed={inferIntraDayDataSourceType(item.source) != null ? this.onTodayPressed : null}
    />

    private readonly keyExtractor = (item) => item.source

    render() {
        if (this.props.data != null) {
            return <View style={StyleTemplates.fillFlex}>
                {
                    this.props.highlightFilter != null ? <HighlightFilterPanel
                        filter={this.props.highlightFilter}
                        highlightedDays={this.props.data.highlightedDays}
                        onDiscardFilterPressed={this.onDiscardFilter}
                        onFilterModified={this.onFilterModified}
                    /> : <></>
                }
                <FlatList
                    ref={this._listRef}
                    windowSize={DataSourceManager.instance.supportedDataSources.length}

                    data={this.props.data.sourceDataList}
                    keyExtractor={this.keyExtractor}
                    ItemSeparatorComponent={this.Separator}
                    renderItem={this.renderItem}
                    onScroll={this.onScroll}
                /></View>
        } else return <></>
    }
}


function mapStateToProps(state: ReduxAppState, ownProps: Props): Props {

    return {
        ...ownProps,
        isLoading: state.explorationDataState.isBusy,
        data: state.explorationDataState.data,
        measureUnitType: state.settingsState.unit,
        overviewScrollY: state.explorationState.uiStatus.overviewScrollY,
        highlightFilter: state.explorationState.info.highlightFilter,
        getToday: DataServiceManager.instance.getServiceByKey(state.settingsState.serviceKey).getToday
    }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: Props): Props {
    return {
        ...ownProps,
        dispatchAction: (action) => dispatch(action)
    }
}

const overviewMainPanel = connect(mapStateToProps, mapDispatchToProps)(OverviewMainPanel)
export { overviewMainPanel as OverviewMainPanel }