import { createGoToBrowseRangeAction, InteractionType, memoUIStatus, ExplorationAction } from "../../../../../state/exploration/interaction/actions";
import React, { useState, Ref } from "react";
import { useSelector, useDispatch, connect } from "react-redux";
import { ReduxAppState } from "../../../../../state/types";
import { FlatList, ScrollView, View } from "react-native";
import { DataSourceChartFrame } from "../../../../exploration/DataSourceChartFrame";
import { OverviewData } from "../../../../../core/exploration/data/types";
import { MeasureUnitType } from "../../../../../measure/DataSourceSpec";
import { Dispatch } from "redux";
import { BusyHorizontalIndicator } from "../../../../exploration/BusyHorizontalIndicator";

interface Props {
    data?: OverviewData,
    isLoading?: boolean,
    measureUnitType?: MeasureUnitType,
    uiStatus?: any
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
            setTimeout(()=>{
                //this._listRef.current.scrollTo({ x: 0, y: this.props.uiStatus.overviewScrollY, animated: false })}, 10)
                this._listRef.current.scrollToOffset({ offset: this.props.uiStatus.overviewScrollY, animated: false })
            }, 1)
                
            }
    }

    componentWillUnmount() {
        console.log("unmount overview main panel.")
        this.props.dispatchAction(memoUIStatus("overviewScrollY", this.state.currentListScrollOffset))
    }

    render() {
        if (this.props.data != null) {
            const overviewData = this.props.data as OverviewData
            
            return <View>
                    {
                        this.props.isLoading === true && <BusyHorizontalIndicator/>
                    }
                <FlatList
                ref={this._listRef}
                data={overviewData.sourceDataList}
                keyExtractor={item => item.source}
                renderItem={({ item }) => <DataSourceChartFrame key={item.source.toString()}
                    data={item}
                    measureUnitType={this.props.measureUnitType}
                    onHeaderPressed={() => {
                        this.props.dispatchAction(createGoToBrowseRangeAction(InteractionType.TouchOnly, item.source))
                    }}
                />}

                onScroll={(event) => {
                    const scrollY = event.nativeEvent.contentOffset.y
                    this.setState({
                        currentListScrollOffset: scrollY
                    })
                }}
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
        uiStatus: state.explorationState.uiStatus
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