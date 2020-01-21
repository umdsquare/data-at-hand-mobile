import { ExplorationInfo as ExplorationInfo } from "../../core/interaction/types";

export enum DataLoadingStatus{
    Loading, Failed, Loaded
}

export interface ExplorationDataState{
    info: ExplorationInfo,
    status: DataLoadingStatus,
    error?: any,
    data: any
}