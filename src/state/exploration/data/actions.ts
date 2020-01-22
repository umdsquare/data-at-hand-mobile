import { ActionTypeBase } from "../../types";
import { ExplorationInfo } from "../../../core/exploration/types";

export enum ExplorationDataActionType{
    StartLoadingDataAction="exploration:data:start_loading_data",
    FinishLoadingDataAction="exploration:data:finish_loading_data",
}
 
export interface StartLoadingData extends ActionTypeBase{
    info: ExplorationInfo,
    taskId: string
}

export interface FinishLoadingData extends ActionTypeBase{
    data?: any,
    error?: any
}