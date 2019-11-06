import { ActionTypeBase } from "../types";
import { ExplorationStateInfo } from "../../core/interaction/types";

export enum ExplorationStateActionTypes {
    StartStateTransition="exploration:start_state_transition",
    FinishStateTransition="exploration:finish_state_transition"
}

export interface FinishStateTransition extends ActionTypeBase{
    newStateInfo?: ExplorationStateInfo
    error?: any
}

//===================================================
