import { startOfDay, subDays, endOfDay } from "date-fns";
import { DateTimeHelper } from "../../time";


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

export enum DataLevel{
    IntraDay="intra",
    DailyActivity = "dailyActivity"
}

export type ParameterKey = "range1"|"range2"|"pivot"

export interface ExplorationInfo{
    type: ExplorationType
    values: Array<{parameter: ParameterType, key?: ParameterKey, value: any}>
    pointingInfo: any
}

export function makeInitialStateInfo(): ExplorationInfo{
    const now = startOfDay(new Date())
    return{
        type: ExplorationType.B_Ovrvw,
        values: [{parameter: ParameterType.Range, value: [DateTimeHelper.toNumberedDateFromDate(subDays(now, 7)), DateTimeHelper.toNumberedDateFromDate(endOfDay(now))]}],
        pointingInfo: null
    }
}