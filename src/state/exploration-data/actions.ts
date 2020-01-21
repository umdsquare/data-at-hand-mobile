import { ActionTypeBase } from "../types";

export enum ExplorationDataActionType{
    StartLoadingDataAction="exploration:data:start_loading_data",
    FinishLoadingDataAction="exploration:data:start_loading_data",
}

export interface StartLoadingData extends ActionTypeBase{
    
}