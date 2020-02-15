import { ActionTypeBase } from "../types";
import { DictationResult } from "../../core/speech/types";

export enum SpeechRecognizerActionType {
    BootstrapAction = "speech:recognition:bootstrap",
    WaitAction = "speech:recognition:wait",
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

export interface SpeechSessionAction extends ActionTypeBase {
    sessionId: string
}

export interface BootstrapAction extends SpeechSessionAction {
}

export interface StartDictationAction extends SpeechSessionAction {

}

export interface UpdateDictationResultAction extends SpeechSessionAction {
    dictationResult: DictationResult
}

export interface TerminateAction extends SpeechSessionAction {
    reason: TerminationReason,
    data?: any
}

export function createUpdateDictationResultAction(dictationResult: DictationResult, sessionId: string): UpdateDictationResultAction {
    return {
        type: SpeechRecognizerActionType.UpdateDictationResult,
        dictationResult,
        sessionId
    }
}

export function createStartDictationAction(sessionId: string): StartDictationAction {
    return {
        type: SpeechRecognizerActionType.StartDictation,
        sessionId
    }
}

export function createWaitAction(sessionId): SpeechSessionAction{
    return {
        type: SpeechRecognizerActionType.WaitAction,
        sessionId
    }
}

export function createBootstrapAction(sessionId: string): BootstrapAction {
    return {
        type: SpeechRecognizerActionType.BootstrapAction,
        sessionId
    }
}

export function craeteFinishDictationAction(sessionId: string): SpeechSessionAction {
    return {
        type: SpeechRecognizerActionType.FinishDictation,
        sessionId
    }
}

export function createTerminateSessionAction(reason: TerminationReason, sessionId: string, data?: any): TerminateAction {
    return {
        type: SpeechRecognizerActionType.TerminateSession,
        reason,
        data,
        sessionId
    }
}