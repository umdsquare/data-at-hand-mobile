import { ActionTypeBase } from "@state/types";
import { ExplorationInfo } from "@core/exploration/ExplorationInfo";

export enum ExplorationDataActionType{
    StartLoadingDataAction="exploration:data:start_loading_data",
    FinishLoadingDataAction="exploration:data:finish_loading_data",
}
 
export interface StartLoadingData extends ActionTypeBase{
    taskId: string,
    serviceKey: string,
}

export interface FinishLoadingData extends ActionTypeBase{
    info: ExplorationInfo,
    data?: any,
    error?: any
}