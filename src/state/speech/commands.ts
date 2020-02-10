import { Dispatch } from "redux";
import { ReduxAppState } from "../types";
import uuid from 'uuid/v4';
import { createBootstrapAction, createTerminateSessionAction, createUpdateDictationResultAction, createStartDictationAction, TerminationReason } from "./actions";
import { voiceDictator } from "../../core/speech/VoiceDictator";
import { DictationResult } from "../../core/speech/types";
import { EventSubscription } from "react-native";
import { SpeechRecognizerSessionStatus } from "./types";
import { naturalLanguageRecognizer } from "../../core/speech/NaturalLanguageRecognizer";


let sessionId: string = null

const subscriptions: Array<EventSubscription> = []

export function startSpeechSession(): (dispatch: Dispatch, getState: () => ReduxAppState) => void {
    return async (dispatch: Dispatch, getState: () => ReduxAppState) => {
        dispatch(createBootstrapAction(sessionId))

        sessionId = uuid()

        console.log("Start speech session")

        try {
            let previousDictationResult: DictationResult = null

            subscriptions.push(voiceDictator.registerStartEventListener(() => {
                dispatch(createStartDictationAction())
            }))

            subscriptions.push(voiceDictator.registerReceivedEventListener(result => {
                //calculate diff
                let resultReturn: DictationResult = null
                if (previousDictationResult) {
                    const Diff = require('diff');
                    resultReturn = {
                        ...result,
                        diffResult: Diff.diffWords(
                            previousDictationResult.text,
                            result.text,
                        ),
                    };
                }
                previousDictationResult = result
                dispatch(createUpdateDictationResultAction(resultReturn || result))
            }))

            subscriptions.push(voiceDictator.registerStopEventListener(error => {
                if (error) {
                    terminate(dispatch, TerminationReason.Fail, error)
                } else {
                    const currentState = getState()
                    const dictationResult = currentState.speechRecognizerState.dictationResult
                    if (dictationResult != null && dictationResult.text != null && dictationResult.text.length > 0) {
                        //can start analyzing
                        //TODO start analysis
                        terminate(dispatch, TerminationReason.Success)
                    } else {
                        //not enough dictation result. finish.
                        terminate(dispatch, TerminationReason.Cancel)
                    }
                }
            }))

            await voiceDictator.start()

        } catch (startError) {
            terminate(dispatch, TerminationReason.Fail)
        }
    }
}

function terminate(dispatch: Dispatch, reason: TerminationReason, data?: any) {
    console.log("terminated speech session.")
    subscriptions.forEach(s => s.remove())
    subscriptions.splice(0)
    dispatch(createTerminateSessionAction(reason, data))
}

export function requestStopDictation(): (dispatch: Dispatch, getState: () => ReduxAppState) => void {
    return async (dispatch: Dispatch, getState: () => ReduxAppState) => {
        const initialState = getState()
        if (initialState.speechRecognizerState.status === SpeechRecognizerSessionStatus.Listening) {
            await voiceDictator.stop();
        }
    }
}