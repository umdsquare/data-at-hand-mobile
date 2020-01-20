import { IDatumBase } from "../../database/types";
import { VisualizationSchema } from "../visualization/types";
import { startOfDay, subDays, endOfDay } from "date-fns";


export enum ExplorationType{
    B_Ovrvw,
    B_Range,
    B_Day,
    C_Cyclic,
    C_CyclicDetail,
    C_TwoRanges
}

export enum ExplorationMode{
    Browse="browse",
    Compare="compare"
}

export enum ParameterType{
    DataSource,
    Date,
    Range,
    CycleType,
    CycleDimension,
}

export type ParameterKey = "range1"|"range2"|"pivot"

export interface ExplorationStateInfo{
    type: ExplorationType
    pointing: boolean
    values: Array<{parameter: ParameterType, key?: ParameterKey, value: any}>
    payload: any
}

export function makeInitialStateInfo(): ExplorationStateInfo{
    const now = startOfDay(new Date())
    return{
        type: ExplorationType.B_Ovrvw,
        pointing: false,
        values: [{parameter: ParameterType.Range, value: [subDays(now, 7).toString(), endOfDay(now).toString()]}],
        payload: null
    }
}

export interface VisualizationPayload{
    visualizationSchema: VisualizationSchema
}

export function isVisualizationPayload(obj: any): boolean{
    return 'visualizationSchema' in obj
}

export interface DefaultChartPayload extends VisualizationPayload{
    measureCode: string,
}