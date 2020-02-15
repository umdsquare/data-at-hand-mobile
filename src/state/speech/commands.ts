import { Dispatch } from "redux";
import { ReduxAppState } from "../types";
import uuid from 'uuid/v4';
import { createBootstrapAction, createTerminateSessionAction, createUpdateDictationResultAction, createStartDictationAction, TerminationReason, createWaitAction } from "./actions";
import { VoiceDictator } from "../../core/speech/VoiceDictator";
import { DictationResult } from "../../core/speech/types";
import { EventSubscription, StatusBar } from "react-native";
import { SpeechRecognizerSessionStatus } from "./types";
import { naturalLanguageRecognizer } from "../../core/speech/NaturalLanguageRecognizer";
import { Subject, BehaviorSubject, Subscription } from 'rxjs';
import { filter, first, ignoreElements } from 'rxjs/operators';
import { sleep } from "../../utils";

const sessionRunning = new BehaviorSubject<boolean>(false)

export function startSpeechSession(sessionId: string): (dispatch: Dispatch, getState: () => ReduxAppState) => void {
    return async (dispatch: Dispatch, getState: () => ReduxAppState) => {
        const currentState = getState()
        console.log(sessionId, "Try start speech session", currentState.speechRecognizerState.status)

        //wait until the previous session stops.
        console.log(sessionId, "Wait until the previous session stops.")
        dispatch(createWaitAction(sessionId))
        await sessionRunning.pipe(
            filter(running => running === false),
            first(),
            ignoreElements()
        ).toPromise()

        //check whether the current session is already terminated.
        const stateAfterWait = getState()
        if (stateAfterWait.speechRecognizerState.currentSessionId !== sessionId) {
            console.log(sessionId, "This session is already canceled. terminate now.")
            sessionRunning.next(false)
            return
        }

        console.log(sessionId, "Start speech session")
        sessionRunning.next(true)
        dispatch(createBootstrapAction(sessionId))

        try {
            console.log(sessionId, "Setup speech components")

            let previousDictationResult: DictationResult = null

            VoiceDictator.instance.registerStartEventListener(() => {
                console.log(sessionId, "dictator start event")
                dispatch(createStartDictationAction(sessionId))
            })

            VoiceDictator.instance.registerReceivedEventListener(result => {
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
                dispatch(createUpdateDictationResultAction(resultReturn || result, sessionId))
            })

            VoiceDictator.instance.registerStopEventListener(async error => {
                console.log(sessionId, "dictator stop event")
                if (error) {
                    console.log(sessionId, "Finish without dictation")
                    terminate(dispatch, TerminationReason.Fail, error)
                } else {
                    const currentState = getState()
                    const dictationResult = currentState.speechRecognizerState.dictationResult
                    if (dictationResult != null && dictationResult.text != null && dictationResult.text.length > 0) {
                        //can start analyzing
                        //TODO start analysis
                        console.log(sessionId, "Analyze...")
                        await sleep(5000)
                        console.log(sessionId, "Finished analyzing.")
                        terminate(dispatch, TerminationReason.Success, sessionId)
                    } else {
                        //not enough dictation result. finish.
                        terminate(dispatch, TerminationReason.Cancel, sessionId)
                    }
                }
            })

            console.log(sessionId, "Start dictator")
            await VoiceDictator.instance.start()

        } catch (startError) {
            console.log(startError)
            terminate(dispatch, TerminationReason.Fail, sessionId)
        }
    }
}

function terminate(dispatch: Dispatch, reason: TerminationReason, sessionId: string, data?: any) {
    console.log(sessionId, "terminated speech session.")
    dispatch(createTerminateSessionAction(reason, sessionId, data))
    VoiceDictator.instance.clearAllListeners()
    sessionRunning.next(false)
}

export function requestStopDictation(sessionId: string): (dispatch: Dispatch, getState: () => ReduxAppState) => void {
    return async (dispatch: Dispatch, getState: () => ReduxAppState) => {
        const initialState = getState()
        console.log("session status:", initialState.speechRecognizerState.status)
        if (initialState.speechRecognizerState.status === SpeechRecognizerSessionStatus.Listening
            && initialState.speechRecognizerState.currentSessionId === sessionId
        ) {
            await VoiceDictator.instance.stop();
        } else if (initialState.speechRecognizerState.status === SpeechRecognizerSessionStatus.Waiting) {
            console.log("stop waiting.")
            dispatch(createTerminateSessionAction(TerminationReason.Cancel, sessionId, null))
        }
    }
}