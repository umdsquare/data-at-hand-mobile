import { createGoToBrowseRangeAction, InteractionType, memoUIStatus, ExplorationAction, createGoToBrowseDayAction } from "../../../../../state/exploration/interaction/actions";
import React from "react";
import { connect } from "react-redux";
import { ReduxAppState } from "../../../../../state/types";
import { FlatList, View } from "react-native";
import { DataSourceChartFrame } from "../../../../exploration/DataSourceChartFrame";
import { OverviewData } from "../../../../../core/exploration/data/types";
import { MeasureUnitType } from "../../../../../measure/DataSourceSpec";
import { Dispatch } from "redux";
import { Sizes } from "../../../../../style/Sizes";
import { DateTimeHelper } from "../../../../../time";
import { inferIntraDayDataSourceType } from "../../../../../core/exploration/types";
import { DataServiceManager } from "../../../../../system/DataServiceManager";

const separatorStyle = {height: Sizes.verticalPadding}

interface Props {
    data?: OverviewData,
    isLoading?: boolean,
    measureUnitType?: MeasureUnitType,
    uiStatus?: any,
    isTouchingChartElement?: boolean,
    getToday?: ()=>Date,
    dispatchAction?: (action: ExplorationAction) => void
}

interface State {
    currentListScrollOffset: number
}

class OverviewMainPanel extends React.PureComponent<Props, State> {

    private _listRef = React.createRef<FlatList<any>>()

    constructor(props) {
        super(props)

        this.state = {
            currentListScrollOffset: 0
        }
    }

    componentDidMount() {
        console.log("mount overview main panel.")
        if (this._listRef.current != null && this.props.uiStatus.overviewScrollY != null) {
            setTimeout(() => {
                this._listRef.current.scrollToOffset({ offset: this.props.uiStatus.overviewScrollY, animated: false })
            }, 1)

        }
    }

    componentWillUnmount() {
        console.log("unmount overview main panel.")
        this.props.dispatchAction(memoUIStatus("overviewScrollY", this.state.currentListScrollOffset))
    }

    private Separator = () => {
        return <View style={separatorStyle}/>
    }

    render() {
        if (this.props.data != null) {
            const overviewData = this.props.data as OverviewData

            return <FlatList
                    nestedScrollEnabled={true}
                    ref={this._listRef}
                    data={overviewData.sourceDataList}
                    keyExtractor={item => item.source}
                    ItemSeparatorComponent = {this.Separator}
                    renderItem={({ item }) => <DataSourceChartFrame key={item.source.toString()}
                        data={item}
                        measureUnitType={this.props.measureUnitType}
                        onHeaderPressed={() => {
                            this.props.dispatchAction(createGoToBrowseRangeAction(InteractionType.TouchOnly, item.source))
                        }}
                        onTodayPressed={inferIntraDayDataSourceType(item.source) != null ? ()=>{
                            this.props.dispatchAction(createGoToBrowseDayAction(InteractionType.TouchOnly, 
                                inferIntraDayDataSourceType(item.source), DateTimeHelper.toNumberedDateFromDate(this.props.getToday())))
                        } : null}
                    />}

                    onScroll={(event) => {
                        const scrollY = event.nativeEvent.contentOffset.y
                        this.setState({
                            ...this.state,
                            currentListScrollOffset: scrollY
                        })
                    }}

                    onScrollBeginDrag={()=>{
                        this.props.dispatchAction(memoUIStatus("overviewScrolling", true))
                    }}

                    onScrollEndDrag={()=>{
                        this.props.dispatchAction(memoUIStatus("overviewScrolling", false))
                    }}

                    scrollEnabled = {this.props.isTouchingChartElement === false}
                    
                />
        } else return <></>
    }
}


function mapStateToProps(state: ReduxAppState, ownProps: Props): Props {

    return {
        ...ownProps,
        isLoading: state.explorationDataState.isBusy,
        data: state.explorationDataState.data,
        measureUnitType: state.settingsState.unit,
        uiStatus: state.explorationState.uiStatus,
        isTouchingChartElement: state.explorationState.touchingElement != null,
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