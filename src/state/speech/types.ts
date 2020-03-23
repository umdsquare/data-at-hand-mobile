import { DictationResult } from '@core/speech/types';
import { SpeechContext } from '@core/speech/nlp/context';

export enum SpeechRecognizerSessionStatus {
    Idle = "idle",
    Waiting = "waiting", // the previous session is still in processing, so waiting.
    Starting = "starting",
    Listening = "listening",
    Analyzing = "analyzing",
}

export interface SpeechRecognizerState {
    status: SpeechRecognizerSessionStatus,
    currentSessionId?: string | null,
    currentSpeechContext?: SpeechContext | null,
    dictationResult?: DictationResult,
    showGlobalPopup: boolean
}

export const INITIAL_STATE = {
    status: SpeechRecognizerSessionStatus.Idle,
    currentSessionId: null,
    currentSpeechContext: null,
    dictationResult: null,
    showGlobalPopup: false
} as SpeechRecognizerState