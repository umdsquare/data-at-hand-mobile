import { ActionTypeBase } from "../../state/types";

export enum ExplorationCommandType{
    SetRange="setR",
    SetDataSource="setDS",
    SelectElementOfDay="selectElmDay",
    SelectElementOfRange="selectElmRange"
}

export interface SetRangeCommand extends ActionTypeBase{
    range: [String, String],
    key?: string
}

export type ExplorationCommand = SetRangeCommand

export function createSetRangeCommand(range: [Date, Date], key?: string): SetRangeCommand{
    return {
        type: ExplorationCommandType.SetRange,
        range: [range[0].toString(), range[1].toString()],
        key
    }
}