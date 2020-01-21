import { IDatumBase } from "../../database/types";
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

export interface ExplorationInfo{
    type: ExplorationType
    pointing: boolean
    values: Array<{parameter: ParameterType, key?: ParameterKey, value: any}>
    pointingInfo: any
}

export function makeInitialStateInfo(): ExplorationInfo{
    const now = startOfDay(new Date())
    return{
        type: ExplorationType.B_Ovrvw,
        pointing: false,
        values: [{parameter: ParameterType.Range, value: [subDays(now, 7).toString(), endOfDay(now).toString()]}],
        pointingInfo: null
    }
}