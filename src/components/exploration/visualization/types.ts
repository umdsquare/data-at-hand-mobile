import { PanResponderInstance } from "react-native";
import { DataSourceType } from "../../../measure/DataSourceSpec";

export interface ChartProps{
    dataSource: DataSourceType,
    dateRange: number[], 
    data: Array<{value: number, numberedDate: number}>,
    containerWidth: number, 
    containerHeight: number,
}

export interface ChartState{
        chartAreaResponder: PanResponderInstance,
        chartAreaTouchPoint: { x: number, y: number },
        isChartAreaTouching: boolean
}