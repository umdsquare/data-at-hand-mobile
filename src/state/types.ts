import { MeasureSettingsState } from "./measure-settings/reducer";
import { Dispatch } from "redux";

export type AppState = {
    measureSettingsState: MeasureSettingsState
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