import { SpeechRecognizerState, INITIAL_STATE, SpeechRecognizerSessionStatus } from "./types";
import { ActionTypeBase } from "../types";
import { SpeechRecognizerActionType, BootstrapAction, StartDictationAction, UpdateDictationResultAction, TerminateAction } from "./actions";


export const speechRecognizerStateReducer = (state: SpeechRecognizerState = INITIAL_STATE, action: ActionTypeBase): SpeechRecognizerState => {
    const newState = {
        ...state
    }

    switch (action.type) {
        case SpeechRecognizerActionType.BootstrapAction:
            if (state.status === SpeechRecognizerSessionStatus.Idle) {
                const a = action as BootstrapAction
                newState.currentSessionId = a.sessionId
                newState.dictationResult = null
                newState.status = SpeechRecognizerSessionStatus.Starting
                return newState;
            } else return state

        case SpeechRecognizerActionType.StartDictation:
            if (state.status === SpeechRecognizerSessionStatus.Starting) {
                const a = action as StartDictationAction
                newState.status = SpeechRecognizerSessionStatus.Listening
                return newState;
            }
        case SpeechRecognizerActionType.UpdateDictationResult:
            if (state.status === SpeechRecognizerSessionStatus.Listening) {
                const a = action as UpdateDictationResultAction
                newState.dictationResult = a.dictationResult
                return newState
            }

        case SpeechRecognizerActionType.TerminateSession:
            {
                const a = action as TerminateAction
                newState.status = SpeechRecognizerSessionStatus.Idle
                return newState
            }
        default:
            return state
    }
}