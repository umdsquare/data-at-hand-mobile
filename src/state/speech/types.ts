import { DictationResult } from "../../core/speech/types";

export enum SpeechRecognizerSessionStatus{
    Idle = "idle",
    Waiting="waiting", // the previous session is still in processing, so waiting.
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