import { Dispatch } from "redux";
import { ReduxAppState, setMetadataToAction } from "../types";
import { createBootstrapAction, createTerminateSessionAction, createUpdateDictationResultAction, createStartDictationAction, TerminationReason, createWaitAction } from "./actions";
import { VoiceDictator } from "../../core/speech/VoiceDictator";
import { DictationResult } from "../../core/speech/types";
import { SpeechRecognizerSessionStatus } from "./types";
import { Mutex } from 'async-mutex';
import { SpeechContext } from "@data-at-hand/core/speech/SpeechContext";
import { DataServiceManager } from "@measure/DataServiceManager";
import { SpeechEventQueue } from "../../core/speech/SpeechEventQueue";
import { SystemLogger } from "@core/logging/SystemLogger";
import { VerboseEventTypes } from '@data-at-hand/core/logging/types';
import { NLUCommandResolver } from "@core/speech/nlp/types";
import { Lazy } from "@data-at-hand/core/utils";
import { notifyError } from "@core/logging/ErrorReportingService";
import { NLUResultType, NLUResult } from "@data-at-hand/core/speech/types";

const sessionMutex = new Mutex()

const nluCommandResolver = new Lazy(() => require("../../core/speech/nlp/nlu").default.instance as NLUCommandResolver)

export function startSpeechSession(sessionId: string, speechContext: SpeechContext): (dispatch: Dispatch, getState: () => ReduxAppState) => void {
    return async (dispatch: Dispatch, getState: () => ReduxAppState) => {
        const currentState = getState()
        console.log("Previous speech session state: ", currentState.speechRecognizerState.status)
        /*
        if(currentState.speechRecognizerState.status === SpeechRecognizerSessionStatus.Listening)
        {
            console.log("It is problematic if the next session intervened while the previous session is still listening. May be the stop dictation command was omitted. Cancel the previous session.")
            VoiceDictator.instance.clearAllListeners()
            await VoiceDictator.instance.stop();
            terminate(dispatch, TerminationReason.Fail, currentState.speechRecognizerState.currentSessionId, {error: "StopDictationOmitted"})
        }*/

        //wait until the previous session stops.
        console.log(sessionId, "Wait until the previous session stops.")
        dispatch(createWaitAction(sessionId))

        const releaseMutex = await sessionMutex.acquire()

        //check whether the current session is already terminated.
        const stateAfterWait = getState()
        if (stateAfterWait.speechRecognizerState.currentSessionId !== sessionId) {
            console.log(sessionId, "This session is already canceled. terminate now.")
            releaseMutex()
            return
        }

        console.log(sessionId, "Start speech session")
        dispatch(createBootstrapAction(sessionId, speechContext))

        try {
            console.log(sessionId, "Setup speech components")

            let previousDictationResult: DictationResult | null = null

            VoiceDictator.instance.registerStartEventListener(() => {
                console.log(sessionId, "dictator start event")
                dispatch(createStartDictationAction(sessionId))
            })

            VoiceDictator.instance.registerReceivedEventListener(result => {
                //calculate diff
                let resultReturn: DictationResult | null = null
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
                    terminate(releaseMutex, dispatch, TerminationReason.Fail, sessionId, error)
                } else {
                    const currentState = getState()

                    const context = currentState.speechRecognizerState.currentSpeechContext
                    context.uiStatus = currentState.explorationState.uiStatus
                    const dictationResult = currentState.speechRecognizerState.dictationResult
                    if (dictationResult != null && dictationResult.text != null && dictationResult.text.length > 0) {
                        //can start analyzing
                        console.log(sessionId, "Analyze the phrase, ", dictationResult.text, "with context: ", context)

                        const service = DataServiceManager.instance.getServiceByKey(currentState.settingsState.serviceKey)
                        let nluResult: NLUResult | undefined = undefined

                        try {
                            nluResult = await nluCommandResolver.get().resolveSpeechCommand(
                                dictationResult.text,
                                context,
                                currentState.explorationState.info,
                                {
                                    getToday: service.getToday,
                                    getGoal: (dataSource) => service.getGoalValue(dataSource),
                                    dataInitialDate: await service.getDataInitialDate(),
                                    measureUnit: currentState.settingsState.unit
                                }
                            )
                        } catch (err) {
                            console.log("speech analyze error - ", dictationResult.text)
                            console.log(err)
                            notifyError(err, report => {
                                report.context = "Speech command analysis"
                                report.errorMessage = "Speech command error for dictated text: - " + dictationResult.text
                                report.metadata = {
                                    dictatedText: dictationResult.text
                                }
                            })
                        }

                        const speechCommandLogId = SystemLogger.instance.logSpeechCommandResult(
                            dictationResult.text,
                            currentState.explorationState.info,
                            context,
                            nluResult != null ? nluResult : "error"
                        )

                        if (nluResult != null) {
                            //NLU successful
                            switch (nluResult.type) {
                                case NLUResultType.Effective:
                                    const inferredActionWithMetadata = setMetadataToAction(nluResult.action!, { speechLogId: speechCommandLogId })
                                    dispatch(inferredActionWithMetadata)
                                    break;
                                case NLUResultType.Void:
                                    SystemLogger.instance.logVerboseToInteractionStateTransition(VerboseEventTypes.VoidSpeechAction, { action: inferredActionWithMetadata, speechLogId: speechCommandLogId })
                                    break;
                                case NLUResultType.Fail:
                                    SystemLogger.instance.logVerboseToInteractionStateTransition(VerboseEventTypes.SpeechCommandFail, { speechLogId: speechCommandLogId })
                                    break;
                            }

                            requestAnimationFrame(() => {
                                SpeechEventQueue.instance.push({
                                    type: nluResult.type,
                                    id: sessionId
                                })
                            })

                            console.log(sessionId, "Finished analyzing.")
                            terminate(releaseMutex, dispatch, TerminationReason.Success, sessionId)
                        } else {
                            //NLU failed.
                            SystemLogger.instance.logVerboseToInteractionStateTransition(VerboseEventTypes.SpeechCommandFail, { speechLogId: speechCommandLogId })
                            terminate(releaseMutex, dispatch, TerminationReason.Fail, sessionId)
                        }
                    } else {
                        //not enough dictation result. finish.
                        terminate(releaseMutex, dispatch, TerminationReason.Cancel, sessionId)
                    }
                }
            })

            console.log(sessionId, "Start dictator")
            await VoiceDictator.instance.start()

        } catch (startError) {
            console.log(startError)
            console.log("speech start error")
            
            notifyError(startError, report => {
                report.context = "Speech start error"
            })

            terminate(releaseMutex, dispatch, TerminationReason.Fail, sessionId)
        }
    }
}

function terminate(releaseMutex: Function, dispatch: Dispatch, reason: TerminationReason, sessionId: string, data?: any) {
    console.log(sessionId, "terminated speech session.")
    dispatch(createTerminateSessionAction(reason, sessionId, data))
    VoiceDictator.instance.clearAllListeners()
    releaseMutex()
}

export function requestStopDictation(sessionId: string): (dispatch: Dispatch, getState: () => ReduxAppState) => void {
    return async (dispatch: Dispatch, getState: () => ReduxAppState) => {
        const initialState = getState()
        console.log("request stop on session status:", initialState.speechRecognizerState.status)
        if (initialState.speechRecognizerState.status === SpeechRecognizerSessionStatus.Listening ||
            initialState.speechRecognizerState.status === SpeechRecognizerSessionStatus.Starting
            && initialState.speechRecognizerState.currentSessionId === sessionId
        ) {
            await VoiceDictator.instance.stop();
        } else if (initialState.speechRecognizerState.status === SpeechRecognizerSessionStatus.Waiting) {
            console.log("stop waiting.")
            dispatch(createTerminateSessionAction(TerminationReason.Cancel, sessionId, null))
        }
    }
}

export function makeNewSessionId(): string {
    return require('uuid/v4')()
}