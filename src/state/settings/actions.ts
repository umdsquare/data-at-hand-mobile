import { ActionTypeBase } from "../types";
import { MeasureUnitType } from "../../measure/DataSourceSpec";

//========================================

export enum SettingsActionTypes {
    SetService = "settings/SET_SERVICE",
    SetUnitType = "settings/SET_UNIT_TYPE",
}

export interface SetServiceAction extends ActionTypeBase {
    serviceKey: string,
    serviceInitialDate?: number
}

export interface SetUnitTypeAction extends ActionTypeBase {
    unitType: MeasureUnitType
}

export type MeasureSettingsAction = SetServiceAction | SetUnitTypeAction


//======================================
export const setService = (serviceKey: string, serviceInitialDate?: number): SetServiceAction => ({
    type: SettingsActionTypes.SetService,
    serviceKey,
    serviceInitialDate
})

export const setUnit = (unit: MeasureUnitType): SetUnitTypeAction => ({
    type: SettingsActionTypes.SetUnitType,
    unitType: unit
})