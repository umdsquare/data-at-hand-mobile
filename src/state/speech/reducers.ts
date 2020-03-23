import { SpeechRecognizerState, INITIAL_STATE, SpeechRecognizerSessionStatus } from "@state/speech/types";
import { ActionTypeBase } from "@state/types";
import { SpeechRecognizerActionType, UpdateDictationResultAction, SpeechSessionAction, SetShowGlobalPopupAction, SetSpeechContextAction } from "@state/speech/actions";


export const speechRecognizerStateReducer = (state: SpeechRecognizerState = INITIAL_STATE, action: ActionTypeBase): SpeechRecognizerState => {
    const newState = {
        ...state
    }

    switch (action.type) {
        case SpeechRecognizerActionType.BootstrapAction:
            {
                const a = action as SetSpeechContextAction
                newState.currentSessionId = a.sessionId
                newState.currentSpeechContext = a.speechContext
                newState.dictationResult = null
                newState.status = SpeechRecognizerSessionStatus.Starting
                return newState;
            }
        case SpeechRecognizerActionType.WaitAction:
            {
                const a = action as UpdateDictationResultAction
                newState.status = SpeechRecognizerSessionStatus.Waiting
                newState.currentSessionId = a.sessionId
                return newState
            }

        case SpeechRecognizerActionType.StartDictation:
            {
                const a = action as UpdateDictationResultAction
                if (state.currentSessionId === a.sessionId) {
                    newState.status = SpeechRecognizerSessionStatus.Listening
                    return newState;
                } else return state;
            }
        case SpeechRecognizerActionType.UpdateDictationResult:
            {
                const a = action as UpdateDictationResultAction
                if (state.currentSessionId === a.sessionId) {
                    newState.dictationResult = a.dictationResult
                    return newState
                } else return state;
            }
        case SpeechRecognizerActionType.TerminateSession:
            {
                const a = action as UpdateDictationResultAction
                if (state.currentSessionId === a.sessionId) {
                    newState.status = SpeechRecognizerSessionStatus.Idle
                    newState.currentSessionId = null
                    newState.currentSpeechContext = null
                    return newState
                } else return state;
            }

        case SpeechRecognizerActionType.SetSpeechContextAction:
            {
                const a = action as SetSpeechContextAction
                if (state.currentSessionId === a.sessionId) {
                    newState.currentSpeechContext = a.speechContext
                    return newState
                } else return state;
            }

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