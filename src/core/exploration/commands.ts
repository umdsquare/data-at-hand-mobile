import { ActionTypeBase } from "../../state/types";
import { DataSourceType } from "../../measure/DataSourceSpec";

export enum ExplorationCommandType{
    SetRange="setR",
    SetDataSource="setDS",
    SelectElementOfDay="selectElmDay",
    SelectElementOfRange="selectElmRange",
    GoToBrowseRange="goToBrowseRange"
}

export enum CommandInteractionType{
    TouchOnly="touchonly",
    Multimodal="multimodal"
}

interface ExplorationCommandBase extends ActionTypeBase{
    interactionType: CommandInteractionType
}

export interface SetRangeCommand extends ExplorationCommandBase{
    range: [number, number],
    key?: string
}

export interface GoToBrowseRangeCommand extends ExplorationCommandBase{
    dataSource?: DataSourceType,
    range?:[number, number]
}

export type ExplorationCommand = SetRangeCommand | GoToBrowseRangeCommand

export function createSetRangeCommand(interactionType: CommandInteractionType, range: [number, number], key?: string): SetRangeCommand{
    return {
        type: ExplorationCommandType.SetRange,
        interactionType,
        range,
        key
    }
}

export function goToBrowseRange(interactionType: CommandInteractionType, dataSource?: DataSourceType, range?: [number,number]): GoToBrowseRangeCommand{
    return {
        type: ExplorationCommandType.GoToBrowseRange,
        interactionType,
        range
    }
}