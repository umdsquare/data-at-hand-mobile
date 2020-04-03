import { ExplorationInfo } from "@data-at-hand/core/exploration/ExplorationInfo"
import { randomString, STRING_SET_ALPHABETS, STRING_SET_NUMBERS } from "@data-at-hand/core/utils"
import { MeasureUnitType } from "@data-at-hand/core/measure/DataSourceSpec"
import { SpeechContext } from "@data-at-hand/core/speech/SpeechContext"
import { NLUResult } from "@data-at-hand/core/speech/types"

export interface NLUOptions {
    getToday: () => Date,
    measureUnit: MeasureUnitType
}

export function makeVariableId() {
    const alphabets= randomString(5, STRING_SET_ALPHABETS)
    const numbers = randomString(5, STRING_SET_NUMBERS)
    return alphabets[0] + numbers[0] + alphabets[1] + numbers[1] + alphabets[2] + numbers[2] + alphabets[3] + numbers[3] + alphabets[4] + numbers[4]
}

export interface NLUCommandResolver{
    resolveSpeechCommand(speech: string, context: SpeechContext, explorationInfo: ExplorationInfo, options: NLUOptions): Promise<NLUResult>
}