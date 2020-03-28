import { NumericConditionType, ExplorationInfo } from "../../exploration/types"
import { randomString, STRING_SET_ALPHABETS, STRING_SET_NUMBERS } from "@utils/utils"
import { DataSourceType, MeasureUnitType } from "@measure/DataSourceSpec"
import { ActionTypeBase } from "@state/types"
import { SpeechContext } from "./context"

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
    additionalInfo?: any,
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
    impliedDataSource?: DataSourceType,
    propertyKey?: "waketime" | "bedtime" | undefined | null
    ref?: number
}

export interface NLUOptions {
    getToday: () => Date,
    measureUnit: MeasureUnitType
}

export function makeVariableId() {
    const alphabets= randomString(5, STRING_SET_ALPHABETS)
    const numbers = randomString(5, STRING_SET_NUMBERS)
    return alphabets[0] + numbers[0] + alphabets[1] + numbers[1] + alphabets[2] + numbers[2] + alphabets[3] + numbers[3] + alphabets[4] + numbers[4]
}

export enum NLUResultType {
    Effective = 1,
    Void = 0,
    Unapplicable = -1,
    Fail = -2,
}

export interface NLUResult {
    type: NLUResultType,
    action?: ActionTypeBase | null,
}

export interface NLUCommandResolver{
    resolveSpeechCommand(speech: string, context: SpeechContext, explorationInfo: ExplorationInfo, options: NLUOptions): Promise<NLUResult>
}