import { IDatumBase } from "../../database/types";
import { VisualizationSchema } from "../visualization/types";

export enum ExplorationStateType{
    Initial=0,
    DefaultChart,
    AggregatedChart,
    MultipleMeasuresDefault,
    MulfipleMEasuresAggregated,
    TimeFrameComparison,
    DateHighlightedCalendar,
    AggregationValueQueryResult
}

export enum ExplorationCommandType{
    SelectMeasure = "SelectMeasure",
    SetTimeFrame = "SetTimeFrame",
}

export interface ExplorationStateInfo{
    stateType: ExplorationStateType
    payload: any
}

export interface ExplorationCommand{
    type: ExplorationCommandType | string,
    invokedAt: number
}

export interface SelectMeasureCommand extends ExplorationCommand{
    measureCode: string
}

export interface VisualizationPayload{
    visualizationSchema: VisualizationSchema
}

export function isVisualizationPayload(obj: any): boolean{
    return 'visualizationSchema' in obj
}

export interface DefaultChartPayload extends VisualizationPayload{
    measureCode: string,
    queriedDuration: {start: number, end: number},
}