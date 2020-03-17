import { ActionTypeBase } from "@state/types";
import { MeasureUnitType } from "@measure/DataSourceSpec";

//========================================

export enum SettingsActionTypes {
    SetService = "settings/SET_SERVICE",
    SetUnitType = "settings/SET_UNIT_TYPE",
    SetRecordLogs = "settings/SET_RECORD_LOGS",
    SetRecordScreens = "settings/SET_RECORD_SCREENS"
}

export interface SetServiceAction extends ActionTypeBase {
    serviceKey: string,
    serviceInitialDate?: number
}

export interface SetUnitTypeAction extends ActionTypeBase {
    unitType: MeasureUnitType
}

export interface SetRecordLogsAction extends ActionTypeBase{
    recordLogs: boolean,
    sessionId?: string
}

export interface SetRecordScreensAction extends ActionTypeBase{
    recordScreens: boolean
}

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

export const setRecordLogs = (recordLogs: boolean, sessionId?: string): SetRecordLogsAction => ({
    type: SettingsActionTypes.SetRecordLogs,
    recordLogs,
    sessionId
})

export const setRecordScreens = (recordScreens: boolean): SetRecordScreensAction => ({
    type: SettingsActionTypes.SetRecordScreens,
    recordScreens
})