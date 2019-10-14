import { DataSourceMeasure } from "../../measure/source/DataSource";
import { ActionTypeBase } from "../types";
import { MeasureUnitType } from "../../measure/MeasureSpec";

//========================================

export enum MeasureSettingsActionTypes {
    SelectSourceForMeasure = "measureSettings/SELECT_SOURCE_FOR_MEASURE",
    DeselectSourceForMeasure = "measureSettings/DESELECT_SOURCE_FOR_MEASURE",
    SetUnitType = "measureSettings/SET_UNIT_TYPE",
}


export interface SelectSourceForMeasureAction extends ActionTypeBase {
    measure: DataSourceMeasure,
    setMainIfNot: boolean
}

export interface DeselectSourceForMeasureAction extends ActionTypeBase {
    measure: DataSourceMeasure,
}

export interface SetUnitTypeAction extends ActionTypeBase {
    unitType: MeasureUnitType
}

export type MeasureSettingsAction = SelectSourceForMeasureAction | DeselectSourceForMeasureAction | SetUnitTypeAction


//======================================
export const selectSourceForMeasure = (measure: DataSourceMeasure, setMainIfNot: boolean): SelectSourceForMeasureAction => ({
    type: MeasureSettingsActionTypes.SelectSourceForMeasure,
    measure: measure,
    setMainIfNot: setMainIfNot
})

export const deselectSourceForMeasure = (measure: DataSourceMeasure): DeselectSourceForMeasureAction => ({
    type: MeasureSettingsActionTypes.DeselectSourceForMeasure,
    measure: measure,
})

export const setUnit = (unit: MeasureUnitType): SetUnitTypeAction => ({
    type: MeasureSettingsActionTypes.SetUnitType,
    unitType: unit
})