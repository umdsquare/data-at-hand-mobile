import { SpeechRecognizerState, INITIAL_STATE, SpeechRecognizerSessionStatus } from "./types";
import { ActionTypeBase } from "../types";
import { SpeechRecognizerActionType, UpdateDictationResultAction, SpeechSessionAction, SetShowGlobalPopupAction } from "./actions";


export const speechRecognizerStateReducer = (state: SpeechRecognizerState = INITIAL_STATE, action: SpeechSessionAction): SpeechRecognizerState => {
    const newState = {
        ...state
    }

    switch (action.type) {
        case SpeechRecognizerActionType.BootstrapAction:
            {
                newState.currentSessionId = action.sessionId
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
                newState.status = SpeechRecognizerSessionStatus.Listening
                return newState;
            } else return state;
        case SpeechRecognizerActionType.UpdateDictationResult:
            if (state.currentSessionId === action.sessionId) {
                const a = action as UpdateDictationResultAction
                newState.dictationResult = a.dictationResult
                return newState
            } else return state;
        case SpeechRecognizerActionType.TerminateSession:
            if (state.currentSessionId === action.sessionId) {
                newState.status = SpeechRecognizerSessionStatus.Idle
                newState.currentSessionId = null
                return newState
            } else return state;

        case SpeechRecognizerActionType.SetShowGlobalPopupAction:
            {
                const a = action as SetShowGlobalPopupAction
                newState.showGlobalPopup = a.value
                return newState
            }
        default:
            return state
    }
}