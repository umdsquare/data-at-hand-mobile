import { createGoToBrowseRangeAction, InteractionType } from "../../../../../state/exploration/interaction/actions";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { ReduxAppState } from "../../../../../state/types";
import { FlatList } from "react-native";
import { DataSourceChartFrame } from "../../../../exploration/DataSourceChartFrame";
import { OverviewData } from "../../../../../core/exploration/data/types";

export const OverviewMainPanel = () => {
    const { data, measureUnitType } = useSelector((appState: ReduxAppState) => ({
        data: appState.explorationDataState.data,
        measureUnitType: appState.settingsState.unit,
    }))
    const dispatch = useDispatch()

    if (data != null) {
        const overviewData = data as OverviewData
        return <FlatList
            data={overviewData.sourceDataList}
            keyExtractor={item => item.source}
            renderItem={({ item }) => <DataSourceChartFrame key={item.source.toString()}
                data={item}
                measureUnitType={measureUnitType}
                onHeaderPressed={() => {
                    dispatch(createGoToBrowseRangeAction(InteractionType.TouchOnly, item.source))
                }}
            />}
        />
    } else return <></>
}