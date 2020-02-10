import { DictationResult } from "../../core/speech/types";

export enum SpeechRecognizerSessionStatus{
    Idle = "idle",
    Starting="starting",
    Listening="listening",
    Analyzing="analyzing",
}

export interface SpeechRecognizerState{
    status: SpeechRecognizerSessionStatus,
    currentSessionId: string
    dictationResult?: DictationResult,
}

export const INITIAL_STATE = {
    status: SpeechRecognizerSessionStatus.Idle,
    currentSessionId: null,
    dictationResult: null
} as SpeechRecognizerState