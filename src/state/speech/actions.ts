import { ActionTypeBase } from "../types";
import { DictationResult } from "../../core/speech/types";

export enum SpeechRecognizerActionType {
    BootstrapAction = "speech:recognition:bootstrap",
    StartDictation = "speech:recognition:start_dictation",
    UpdateDictationResult = "speech:recognition:update_dictation_result",
    FinishDictation = "speech:recognition:finish_dictation",
    TerminateSession = "speech:recognition:terminate"
}


export enum TerminationReason {
    Success,
    Fail,
    Cancel,
}

export interface TerminationPayload {
    reason: TerminationReason;
    data?: any;
}


export interface BootstrapAction extends ActionTypeBase {
    sessionId: string
}

export interface StartDictationAction extends ActionTypeBase {

}

export interface UpdateDictationResultAction extends ActionTypeBase {
    dictationResult: DictationResult
}

export interface TerminateAction extends ActionTypeBase {
    reason: TerminationReason,
    data?: any
}

export function createUpdateDictationResultAction(dictationResult: DictationResult): UpdateDictationResultAction {
    return {
        type: SpeechRecognizerActionType.UpdateDictationResult,
        dictationResult
    }
}

export function createStartDictationAction(): StartDictationAction {
    return {
        type: SpeechRecognizerActionType.StartDictation
    }
}

export function createBootstrapAction(sessionId: string): BootstrapAction {
    return {
        type: SpeechRecognizerActionType.BootstrapAction,
        sessionId
    }
}

export function craeteFinishDictationAction(): ActionTypeBase {
    return {
        type: SpeechRecognizerActionType.FinishDictation
    }
}

export function createTerminateSessionAction(reason: TerminationReason, data?: any): TerminateAction {
    return {
        type: SpeechRecognizerActionType.TerminateSession,
        reason,
        data
    }
}