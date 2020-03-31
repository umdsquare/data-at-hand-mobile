import { ActionTypeBase } from "../types";
import { DictationResult } from "../../core/speech/types";
import { SpeechContext } from "@data-at-hand/core/speech/SpeechContext";

export enum SpeechRecognizerActionType {
    BootstrapAction = "speech:recognition:bootstrap",
    WaitAction = "speech:recognition:wait",
    StartDictation = "speech:recognition:start_dictation",
    UpdateDictationResult = "speech:recognition:update_dictation_result",
    FinishDictation = "speech:recognition:finish_dictation",
    TerminateSession = "speech:recognition:terminate",
    SetShowGlobalPopupAction = "speech:recognition:set_show_global_popup",
    SetSpeechContextAction = "speech:recognition:set_speech_context"
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

export interface UpdateDictationResultAction extends SpeechSessionAction {
    dictationResult: DictationResult
}

export interface TerminateAction extends SpeechSessionAction {
    reason: TerminationReason,
    data?: any
}

export interface SetShowGlobalPopupAction extends SpeechSessionAction {
    value: boolean
}

export interface SetSpeechContextAction extends SpeechSessionAction {
    speechContext: SpeechContext | null
}

export function createUpdateDictationResultAction(dictationResult: DictationResult, sessionId: string): UpdateDictationResultAction {
    return {
        type: SpeechRecognizerActionType.UpdateDictationResult,
        dictationResult,
        sessionId
    }
}

export function createStartDictationAction(sessionId: string): SpeechSessionAction {
    return {
        type: SpeechRecognizerActionType.StartDictation,
        sessionId
    }
}

export function createWaitAction(sessionId: string): SpeechSessionAction{
    return {
        type: SpeechRecognizerActionType.WaitAction,
        sessionId
    }
}

export function createBootstrapAction(sessionId: string, speechContext: SpeechContext): SetSpeechContextAction {
    return {
        type: SpeechRecognizerActionType.BootstrapAction,
        sessionId,
        speechContext
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

export function createSetShowGlobalPopupAction(value: boolean, sessionId: string): SetShowGlobalPopupAction {
    return {
        type: SpeechRecognizerActionType.SetShowGlobalPopupAction,
        sessionId,
        value
    }
}

export function createSetSpeechContextAction(speechContext: SpeechContext, sessionId: string): SetSpeechContextAction {
    return {
        type: SpeechRecognizerActionType.SetSpeechContextAction,
        sessionId,
        speechContext
    }
}