import { MeasureSettingsState } from "./measure-settings/reducer";
import { Dispatch } from "redux";
import { ExplorationState } from "./exploration/reducers";

export type ReduxAppState = {
    measureSettingsState: MeasureSettingsState,
    explorationState: ExplorationState
}

export interface ActionTypeBase{
    type: string
}

export enum AsyncActionStatus{
    Started=0, Completed=1, Failed=2
}

export interface PropsWithDispatch{
    dispatch: Dispatch
}