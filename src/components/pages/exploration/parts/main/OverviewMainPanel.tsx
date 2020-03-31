import { createGoToBrowseRangeAction, InteractionType, memoUIStatus, ExplorationAction, createGoToBrowseDayAction, setHighlightFilter } from "@state/exploration/interaction/actions";
import React from "react";
import { connect } from "react-redux";
import { ReduxAppState } from "@state/types";
import { FlatList, View, LayoutAnimation, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { DataSourceChartFrame, HEADER_HEIGHT, FOOTER_HEIGHT } from "@components/exploration/DataSourceChartFrame";
import { OverviewData, OverviewSourceRow } from "@core/exploration/data/types";
import { MeasureUnitType, DataSourceType } from "@measure/DataSourceSpec";
import { Sizes } from "@style/Sizes";
import { DateTimeHelper } from "@utils/time";
import { inferIntraDayDataSourceType, HighlightFilter } from "@core/exploration/types";
import { DataServiceManager } from "@measure/DataServiceManager";
import { HighlightFilterPanel } from "@components/exploration/HighlightFilterPanel";
import { DataSourceManager } from "@measure/DataSourceManager";
import { startLoadingForInfo } from "@state/exploration/data/reducers";
import { ThunkDispatch } from "redux-thunk";
import { DataService } from "@measure/service/DataService";
import { CommonBrowsingChartStyles, DateRangeScaleContext } from "@components/visualization/browse/common";
import { ScaleBand } from "d3-scale";

const MIN_REFRESH_TIME_FOR_PERCEPTION = 1000

const separatorStyle = { height: Sizes.verticalPadding }

interface Props {
    data?: OverviewData,
    isLoading?: boolean,
    measureUnitType?: MeasureUnitType,
    overviewScrollY?: any,
    highlightFilter?: HighlightFilter,
    selectedService?: DataService,
    dispatchAction?: (action: ExplorationAction) => void,
    dispatchDataReload?: () => void,
}

interface State {
    scaleX: ScaleBand<number>,
    refreshingSince?: number | null
}

class OverviewMainPanel extends React.PureComponent<Props, State> {

    static getDerivedStateFromProps(nextProps: Props, currentState: State): State | null {

        if (nextProps.data != null && nextProps.data.range != null) {

            const currenDomain = currentState.scaleX.domain()
            if (currenDomain[0] !== nextProps.data.range[0] || currenDomain[1] !== nextProps.data.range[1]){
                return {
                    ...currentState,
                    scaleX: CommonBrowsingChartStyles.makeDateScale(currentState.scaleX.copy(), nextProps.data.range[0], nextProps.data.range[1])
                }
            }else return null
        } else return null
    }

    private _listRef = React.createRef<FlatList<any>>()

    currentListScrollOffset: number

    currentTimeoutForRefreshingFlag: NodeJS.Timeout | undefined = undefined

    constructor(props: Props) {
        super(props)

        this.state = {
            scaleX: CommonBrowsingChartStyles.makeDateScale(undefined, props.data.range[0], props.data.range[1]),
            refreshingSince: null
        }
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

        if (prevProps.isLoading === true && this.props.isLoading === false && this.state.refreshingSince != null) {

            if (this.currentTimeoutForRefreshingFlag) {
                clearTimeout(this.currentTimeoutForRefreshingFlag)
            }

            const minLoadingTimeLeft = Math.max(MIN_REFRESH_TIME_FOR_PERCEPTION, Date.now() - this.state.refreshingSince)
            if (minLoadingTimeLeft > 0) {
                this.currentTimeoutForRefreshingFlag = setTimeout(() => {
                    this.setState({
                        ...this.state,
                        refreshingSince: null
                    })
                    console.log("finished refreshing.")
                }, minLoadingTimeLeft)
            } else {
                this.setState({
                    ...this.state,
                    refreshingSince: null
                })

                console.log("finished refreshing.")
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
            inferIntraDayDataSourceType(source), DateTimeHelper.toNumberedDateFromDate(this.props.selectedService.getToday())))
    }

    private readonly onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollY = event.nativeEvent.contentOffset.y
        this.currentListScrollOffset = scrollY
    }


    private readonly getItemLayout = (_: any, index: number) => {
        const height = CommonBrowsingChartStyles.CHART_HEIGHT + HEADER_HEIGHT + FOOTER_HEIGHT + separatorStyle.height
        return { length: height, offset: height * index, index }
    }


    private readonly renderItem = ({ item }: { item: OverviewSourceRow }) => <DataSourceChartFrame key={item.source.toString()}
        data={item}
        filter={this.props.highlightFilter}
        highlightedDays={this.props.data.highlightedDays}
        measureUnitType={this.props.measureUnitType}
        onHeaderPressed={this.onHeaderPressed}
        onTodayPressed={inferIntraDayDataSourceType(item.source) != null ? this.onTodayPressed : null}
    />

    private readonly keyExtractor = (item: OverviewSourceRow) => item.source

    private readonly onRefresh = async () => {
        console.log("start refresh")
        this.setState({
            ...this.state,
            refreshingSince: Date.now()
        })

        await this.props.selectedService.refreshDataToReflectRecentInfo()

        this.props.dispatchDataReload()
    }

    render() {
        if (this.props.data != null) {
            return <DateRangeScaleContext.Provider value={this.state.scaleX}>
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
                    refreshing={this.state.refreshingSince != null}
                    onRefresh={this.onRefresh}
                    getItemLayout={this.getItemLayout}
                />
            </DateRangeScaleContext.Provider>
        } else return <></>
    }
}


function mapStateToProps(state: ReduxAppState, ownProps: Props): Props {

    const selectedService = DataServiceManager.instance.getServiceByKey(state.settingsState.serviceKey)

    return {
        ...ownProps,
        isLoading: state.explorationDataState.isBusy,
        data: state.explorationDataState.data,
        measureUnitType: state.settingsState.unit,
        overviewScrollY: state.explorationState.uiStatus.overviewScrollY,
        highlightFilter: state.explorationState.info.highlightFilter,
        selectedService,
    }
}

function mapDispatchToProps(dispatch: ThunkDispatch<{}, {}, any>, ownProps: Props): Props {
    return {
        ...ownProps,
        dispatchAction: (action) => dispatch(action),
        dispatchDataReload: () => dispatch(startLoadingForInfo(undefined, true))
    }
}

const overviewMainPanel = connect(mapStateToProps, mapDispatchToProps)(OverviewMainPanel)
export { overviewMainPanel as OverviewMainPanel }