import { SpeechRecognizerState, INITIAL_STATE, SpeechRecognizerSessionStatus } from "./types";
import { ActionTypeBase } from "../types";
import { SpeechRecognizerActionType, BootstrapAction, StartDictationAction, UpdateDictationResultAction, TerminateAction, SpeechSessionAction } from "./actions";


export const speechRecognizerStateReducer = (state: SpeechRecognizerState = INITIAL_STATE, action: SpeechSessionAction): SpeechRecognizerState => {
    const newState = {
        ...state
    }

    console.log("action: ", action.type, ", currentId:", state.currentSessionId, "action id: ", action.sessionId)

    switch (action.type) {
        case SpeechRecognizerActionType.BootstrapAction:
            {
                const a = action as BootstrapAction
                newState.currentSessionId = a.sessionId
                newState.dictationResult = null
                newState.status = SpeechRecognizerSessionStatus.Starting
                return newState;
            }
        case SpeechRecognizerActionType.WaitAction:
            newState.status = SpeechRecognizerSessionStatus.Waiting
            newState.currentSessionId = action.sessionId
            return newState

        case SpeechRecognizerActionType.StartDictation:
            if (state.currentSessionId === action.sessionId) {
                const a = action as StartDictationAction
                newState.status = SpeechRecognizerSessionStatus.Listening
                return newState;
            }
        case SpeechRecognizerActionType.UpdateDictationResult:
            if (state.currentSessionId === action.sessionId) {
                const a = action as UpdateDictationResultAction
                newState.dictationResult = a.dictationResult
                return newState
            }
        case SpeechRecognizerActionType.TerminateSession:
            if (state.currentSessionId === action.sessionId) {
                const a = action as TerminateAction
                newState.status = SpeechRecognizerSessionStatus.Idle
                newState.currentSessionId = null
                return newState
            }
        default:
            return state
    }
}