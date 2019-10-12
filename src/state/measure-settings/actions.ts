import { DataSourceMeasure } from "../../measure/source/DataSource";
import { ActionTypeBase, AsyncActionStatus } from "../types";

//========================================

export enum MeasureSettingsActionTypes {
    SelectSourceForMeasure = "SELECT_SOURCE_FOR_MEASURE",
    DeselectSourceForMeasure = "DESELECT_SOURCE_FOR_MEASURE",
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