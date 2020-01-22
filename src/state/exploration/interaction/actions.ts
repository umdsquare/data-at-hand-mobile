import { ActionTypeBase } from "../../types";
import { ExplorationInfo } from "../../../core/exploration/types";

export enum ExplorationStateActionTypes {
    StartStateTransition="exploration:interaction:start_state_transition",
    FinishStateTransition="exploration:interaction:finish_state_transition"
}

export interface FinishStateTransition extends ActionTypeBase{
    newStateInfo?: ExplorationInfo
    error?: any
}

//===================================================
