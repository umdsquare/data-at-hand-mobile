import { SettingsState } from "./settings/reducer";
import { Dispatch } from "redux";
import { ExplorationState } from "./exploration/interaction/reducers";
import { ExplorationDataState } from "./exploration/data/reducers";


export type ReduxAppState = {
    settingsState: SettingsState,
    explorationState: ExplorationState,
    explorationDataState: ExplorationDataState
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