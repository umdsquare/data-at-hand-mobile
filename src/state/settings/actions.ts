import { ActionTypeBase } from "../types";
import { MeasureUnitType } from "../../measure/MeasureSpec";

//========================================

export enum SettingsActionTypes {
    SetService = "settings/SET_SERVICE",
    SetUnitType = "settings/SET_UNIT_TYPE",
}

export interface SetServiceAction extends ActionTypeBase {
    serviceKey: string,
}

export interface SetUnitTypeAction extends ActionTypeBase {
    unitType: MeasureUnitType
}

export type MeasureSettingsAction = SetServiceAction | SetUnitTypeAction


//======================================
export const setService = (serviceKey: string): SetServiceAction => ({
    type: SettingsActionTypes.SetService,
    serviceKey: serviceKey
})

export const setUnit = (unit: MeasureUnitType): SetUnitTypeAction => ({
    type: SettingsActionTypes.SetUnitType,
    unitType: unit
})