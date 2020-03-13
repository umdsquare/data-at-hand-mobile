import { PanResponderInstance } from "react-native";
import { DataSourceType } from "../../../measure/DataSourceSpec";
import { HighlightFilter } from "../../../core/exploration/types";

export interface ChartProps{
    dataSource: DataSourceType,
    dateRange: number[],
    preferredValueRange: number[],
    data: Array<{value: number, numberedDate: number}>,
    containerWidth: number, 
    containerHeight: number,
    highlightFilter?: HighlightFilter,
    highlightedDays?: {[key:number]:boolean|undefined}
}

export interface ChartState{
        chartAreaResponder: PanResponderInstance,
        chartAreaTouchPoint: { x: number, y: number },
        isChartAreaTouching: boolean
}