import { ActionTypeBase } from "../../types"
import { DataSourceType } from "../../../measure/DataSourceSpec"
import { TouchingElementInfo } from "../../../core/exploration/types"

const ACTION_PREFIX = "exploration:interaction:"

export enum ExplorationActionType{
    MemoUiStatus="exploration:interaction:memoUIStatus",
    SetRange="exploration:interaction:setRange",
    SetDataSource="exploration:interaction:setDataSource",
    SetDate="exploration:interaction:setDate",
    
    GoToBrowseRange="exploration:interaction:goToBrowseRange",
    GoToBrowseOverview = "exploration:interaction:goToBrowseOverview",
    GoToBrowseDay = "exploration:interaction:goToBrowseDay",

    //History 
    RestorePreviousInfo="exploration:interaction:restorePreviousInfo",
    GoBack="exploration:interaction:goBack",
    
    //Touch
    SetTouchElementInfo="exploration:interaction:setTouchElementInfo"
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

export interface SetDateAction extends ExplorationActionBase{
    date: number
}

export interface SetDataSourceAction extends ExplorationActionBase{
    dataSource: DataSourceType
}

export interface GoToBrowseRangeAction extends ExplorationActionBase{
    dataSource?: DataSourceType,
    range?:[number, number]
}

export interface GoToBrowseDayAction extends ExplorationActionBase{
    dataSource?: DataSourceType,
    date?: number
}

export interface SetTouchingElementInfoAction extends ActionTypeBase{
    info: TouchingElementInfo
}

export type ExplorationAction = ActionTypeBase | ExplorationActionBase | SetRangeAction | SetDateAction | GoToBrowseRangeAction | GoToBrowseDayAction | MemoUIStatusAction | SetDataSourceAction | SetTouchingElementInfoAction

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

export function createGoToBrowseDayAction(interactionType: InteractionType, dataSource?: DataSourceType, date?: number): GoToBrowseDayAction{
    return {
        type: ExplorationActionType.GoToBrowseDay,
        interactionType,
        dataSource,
        date
    }
}

export function createRestorePreviousInfoAction(): ActionTypeBase{
    return {
        type: ExplorationActionType.RestorePreviousInfo
    }
}

export function memoUIStatus(key: string, value: any): MemoUIStatusAction{
    return {
        type: ExplorationActionType.MemoUiStatus,
        key,
        value
    }
}

export function setDataSourceAction(interactionType: InteractionType, dataSource: DataSourceType): SetDataSourceAction{
    return {
        type: ExplorationActionType.SetDataSource,
        interactionType,
        dataSource
    }
}

export function setDateAction(interactionType: InteractionType, date: number): SetDateAction{
    return {
        type: ExplorationActionType.SetDate,
        interactionType,
        date 
    }
}

export function setTouchElementInfo(info: TouchingElementInfo): SetTouchingElementInfoAction{
    return {
        type: ExplorationActionType.SetTouchElementInfo,
        info
    }
}

export function goBackAction(): ActionTypeBase{
    return {
        type:ExplorationActionType.GoBack
    }
}

//===================================================
