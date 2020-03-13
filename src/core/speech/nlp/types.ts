import { NumericConditionType } from "../../exploration/types"
import { randomString } from "../../../utils"

export const MONTH_NAMES = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]

export enum VariableType {
    DataSource = "DataSource",
    Date = "Date",
    Period = "Period",
    Verb = "Verb",
    TimeCycle = "CyclicTime",
    Condition = "Condition"
}

export interface VariableInfo {
    type: VariableType,
    value: any,
    originalText: string,
    id: string
}

export type VariableInfoDict = {
    [id: string]: VariableInfo
}

export interface PreProcessedInputText {
    processed: string,
    original: string,
    variables: VariableInfoDict,
    intent: Intent
}

export enum Intent {
    AssignTrivial = "Assign",
    Browse = "Browse",
    Compare = "Compare",
    Highlight = "Highlight"
}

export interface VerbInfo {
    root: string,
    type: Intent
}

export interface ConditionInfo {
    type: NumericConditionType,
    property?: "waketime" | "bedtime" | undefined | null
    unit?: string
    ref?: number
}

export interface NLUOptions {
    getToday: () => Date,
}

export function makeVariableId() {
    return randomString(5)
}