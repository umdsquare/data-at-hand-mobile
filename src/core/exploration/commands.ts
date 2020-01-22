import { ActionTypeBase } from "../../state/types";

export enum ExplorationCommandType{
    SetRange="setR",
    SetDataSource="setDS",
    SelectElementOfDay="selectElmDay",
    SelectElementOfRange="selectElmRange"
}

export interface SetRangeCommand extends ActionTypeBase{
    range: [number, number],
    key?: string
}

export type ExplorationCommand = SetRangeCommand

export function createSetRangeCommand(numberedDateRange: [number, number], key?: string): SetRangeCommand{
    return {
        type: ExplorationCommandType.SetRange,
        range: numberedDateRange,
        key
    }
}