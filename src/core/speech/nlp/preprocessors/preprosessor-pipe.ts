import compromise from 'compromise';
import { VariableInfo, Intent } from '@data-at-hand/core/speech/types';

type PipelineRoutineType = (input: PipelineResult) => Promise<PipelineResult | null> | PipelineResult | null

export interface PipelineResult {
    processedSpeech: string,
    variables: { [id: string]: VariableInfo },
    intent?: Intent | null
    payload: {
        nlp?: compromise.Document
    }
}

export function definePipe(name: string, routine: PipelineRoutineType) {
    return {
        name,
        routine
    }
}

export async function runPipe(speech: string, ...pipes: Array<{ name: string, routine: PipelineRoutineType }>): Promise<PipelineResult> {
    let pipelineResult = {
        processedSpeech: speech,
        variables: {},
        payload: {}
    } as PipelineResult

    for (const pipe of pipes) {
        console.debug("Preprocess routine:", pipe.name)
        const routineReturn = pipe.routine(pipelineResult)

        pipelineResult = typeof (routineReturn as any)["then"] === 'function'? await routineReturn : routineReturn as PipelineResult
        if (/^(([a-zA-Z][0-9]){5}\s?)+$/i.test(pipelineResult.processedSpeech) === true) {
            //no more texts to parse
            console.debug("No more text to parse. Skip the rest of the pipes")
            break;
        } else {
            console.debug("Proceed to the next pipe.")
        }
    }

    return pipelineResult
}