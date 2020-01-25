import { ActionTypeBase } from "../../types"
import { DataSourceType } from "../../../measure/DataSourceSpec"


export enum ExplorationActionType{
    SetRange="setR",
    SetDataSource="setDS",
    SelectElementOfDay="selectElmDay",
    SelectElementOfRange="selectElmRange",
    GoToBrowseRange="goToBrowseRange"
}

export enum InteractionType{
    TouchOnly="touchonly",
    Multimodal="multimodal"
}

interface ExplorationActionBase extends ActionTypeBase{
    interactionType: InteractionType
}

export interface SetRangeAction extends ExplorationActionBase{
    range: [number, number],
    key?: string
}

export interface GoToBrowseRangeAction extends ExplorationActionBase{
    dataSource?: DataSourceType,
    range?:[number, number]
}

export type ExplorationAction = SetRangeAction | GoToBrowseRangeAction

export function createSetRangeAction(interactionType: InteractionType, range: [number, number], key?: string): SetRangeAction{
    return {
        type: ExplorationActionType.SetRange,
        interactionType,
        range,
        key
    }
}

export function createGoToBrowseRangeAction(interactionType: InteractionType, dataSource?: DataSourceType, range?: [number,number]): GoToBrowseRangeAction{
    return {
        type: ExplorationActionType.GoToBrowseRange,
        interactionType,
        range
    }
}

//===================================================
