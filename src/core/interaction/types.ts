import { IDatumBase } from "../../database/types";
import { VisualizationSchema } from "../visualization/types";
import { DurationSemantic, Presets } from "./time";


export enum ExplorationType{
    B_Ovrvw,
    B_Range,
    B_Day,
    C_Cyclic,
    C_CyclicDetail,
    C_TwoRanges
}

export enum ParameterType{
    DataSource,
    Date,
    Range,
    CycleType,
    CycleDimension,
}


export interface ExplorationStateInfo{
    type: ExplorationType
    pointing: boolean
    values: Array<{parameter: ParameterType, value: any}>
    payload: any
}

export function makeInitialStateInfo(): ExplorationStateInfo{
    return{
        type: ExplorationType.B_Ovrvw,
        pointing: false,
        values: [{parameter: ParameterType.Range, value: Presets.THIS_WEEK}],
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
    queriedDuration: DurationSemantic,
}