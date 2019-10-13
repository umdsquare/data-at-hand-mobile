import { DataSourceMeasure } from "../../measure/source/DataSource";
import { ActionTypeBase } from "../types";

//========================================

export enum MeasureSettingsActionTypes {
    SelectSourceForMeasure = "measureSettings/SELECT_SOURCE_FOR_MEASURE",
    DeselectSourceForMeasure = "measureSettings/DESELECT_SOURCE_FOR_MEASURE",
}


export interface SelectSourceForMeasureAction extends ActionTypeBase {
    measure: DataSourceMeasure,
    setMainIfNot: boolean
}

export interface DeselectSourceForMeasureAction extends ActionTypeBase {
    measure: DataSourceMeasure,
}

export type MeasureSettingsAction = SelectSourceForMeasureAction | DeselectSourceForMeasureAction


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