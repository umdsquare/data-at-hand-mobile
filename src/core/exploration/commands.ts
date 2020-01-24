import { ActionTypeBase } from "../../state/types";

export enum ExplorationCommandType{
    SetRange="setR",
    SetDataSource="setDS",
    SelectElementOfDay="selectElmDay",
    SelectElementOfRange="selectElmRange"
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

export type ExplorationCommand = SetRangeCommand

export function createSetRangeCommand(interactionType: CommandInteractionType, numberedDateRange: [number, number], key?: string): SetRangeCommand{
    return {
        type: ExplorationCommandType.SetRange,
        interactionType: interactionType,
        range: numberedDateRange,
        key
    }
}