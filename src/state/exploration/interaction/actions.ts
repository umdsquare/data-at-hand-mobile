import { ActionTypeBase } from "../../types"
import { DataSourceType } from "../../../measure/DataSourceSpec"

const ACTION_PREFIX = "exploration:interaction:"

export enum ExplorationActionType{
    MemoUiStatus="exploration:interaction:memoUIStatus",
    SetRange="exploration:interaction:setR",
    SetDataSource="exploration:interaction:setDS",
    SelectElementOfDay="exploration:interaction:selectElmDay",
    SelectElementOfRange="exploration:interaction:selectElmRange",
    GoToBrowseRange="exploration:interaction:goToBrowseRange",
    GoToBrowseOverview = "exploration:interaction:goToBrowseOverview",
    Redo="exploration:interaction:redo",
    Undo="exploration:interaction:undo"
}

export enum InteractionType{
    TouchOnly="touchonly",
    Multimodal="multimodal"
}

interface ExplorationActionBase extends ActionTypeBase{
    interactionType: InteractionType
}

export interface MemoUIStatusAction extends ActionTypeBase{
    key: string,
    value: any
}

export interface SetRangeAction extends ExplorationActionBase{
    range: [number, number],
    key?: string
}

export interface GoToBrowseRangeAction extends ExplorationActionBase{
    dataSource?: DataSourceType,
    range?:[number, number]
}

export type ExplorationAction = ExplorationActionBase | SetRangeAction | GoToBrowseRangeAction | MemoUIStatusAction

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
        range,
        dataSource
    }
}

export function createGoToBrowseOverviewAction(interactionType: InteractionType): ExplorationActionBase{
    return {
        type: ExplorationActionType.GoToBrowseOverview,
        interactionType
    }
}

export function createUndoAction(interactionType: InteractionType): ExplorationActionBase{
    return {
        type: ExplorationActionType.Undo,
        interactionType
    }
}

export function createRedoAction(interactionType: InteractionType): ExplorationActionBase{
    return {
        type: ExplorationActionType.Redo,
        interactionType
    }
}

export function memoUIStatus(key: string, value: any): MemoUIStatusAction{
    return {
        type: ExplorationActionType.MemoUiStatus,
        key,
        value
    }
}

//===================================================
