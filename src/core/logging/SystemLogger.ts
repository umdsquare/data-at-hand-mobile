import { DirectoryLogger } from "@core/logging/DirectoryLogger"
import { ExplorationInfo } from "@data-at-hand/core/exploration/ExplorationInfo"
import { SpeechContext } from "@data-at-hand/core/speech/SpeechContext"
import { ActionTypeBase } from "@state/types"
import Share from 'react-native-share'
import { randomString, Lazy } from "@data-at-hand/core/utils"
import { InteractionTransitionLogType, VerboseEventTypes } from '@data-at-hand/core/logging/types'
import { NLUResult } from "@data-at-hand/core/speech/types"
import path from 'react-native-path';
import { exists, mkdir, moveFile } from "react-native-fs"
import { getUploadServerHostUrl } from "./common"
import { getUniqueId } from "react-native-device-info"

enum LogFileName {
    SpeechCommandLogs = "speech_command.jsonl",
    InteractionTransitionLogs = "interaction_state_transition.jsonl"
}

export class SystemLogger {
    private static _instance: SystemLogger | undefined = undefined

    static get instance(): SystemLogger {
        if (this._instance == null) {
            this._instance = new SystemLogger()
        }
        return this._instance
    }

    private shortId = new Lazy(() => require('shortid'))

    private constructor() { }

    private _sessionId: string | null = null
    private currentLogger: DirectoryLogger | null = null

    public enabled = false

    set sessionId(id: string) {
        console.log("set logging session id: ", id)
        this._sessionId = id;
        if (id) {
            if (this.currentLogger && this.currentLogger.directoryPath === "logs/" + id) {
            } else this.currentLogger = new DirectoryLogger("logs/" + id, id)
        } else {
            this.currentLogger = null
        }
    }

    get sessionId(): string | null {
        return this._sessionId
    }

    get logDirectoryPath(): string | null {
        if (this.currentLogger) {
            return this.currentLogger.fullDirectoryPath
        } else return null
    }

    async clearLogsInCurrentSession(): Promise<void> {
        if (this.currentLogger) {
            await this.currentLogger.removeAllFilesInDirectory()
        }
    }

    logSpeechCommandResult(text: string, explorationInfo: ExplorationInfo, context: SpeechContext, result: NLUResult): string {
        if (this.currentLogger && this.enabled === true) {

            const logId = this.makeLogId(Date.now());
            this.currentLogger.appendJsonLine(LogFileName.SpeechCommandLogs,
                {
                    id: logId,
                    inputText: text,
                    explorationInfo,
                    speechContext: context,
                    result
                })
            return logId
        } else return null;
    }

    makeLogId(timestamp: number): string {
        return this.shortId.get().generate()
    }

    logVerboseToInteractionStateTransition(event: VerboseEventTypes, content: Object, logId?: string, timestamp?: number): void {
        if (this.currentLogger && this.enabled === true) {

            if (timestamp == null) {
                timestamp = Date.now()
            }

            if (logId == null) {
                logId = this.makeLogId(timestamp);
            }

            this.currentLogger.appendJsonLine(LogFileName.InteractionTransitionLogs,
                {
                    type: InteractionTransitionLogType.VerboseEvent,
                    id: logId,
                    event,
                    ...content
                }, timestamp)
        } else return
    }

    logInteractionStateTransition(serviceKey: string, action: ActionTypeBase, nextInfo: ExplorationInfo, logId?: string, timestamp?: number): void {
        if (this.currentLogger && this.enabled === true) {

            if (timestamp == null) {
                timestamp = Date.now()
            }

            if (logId == null) {
                logId = this.makeLogId(timestamp);
            }

            this.currentLogger.appendJsonLine(LogFileName.InteractionTransitionLogs,
                {
                    type: InteractionTransitionLogType.Transition,
                    id: logId,
                    service: serviceKey,
                    //prevInfo: prevState.info,
                    action,
                    nextInfo
                }, timestamp)
        } else return
    }

    async handleScreenshot(logId: string, uri: string): Promise<void> {
        const directoryPath = path.resolve(this.logDirectoryPath, "screens")
        const directoryExists = await exists(directoryPath)
        if (directoryExists === false) {
            await mkdir(directoryPath)
        }

        const finalScreenshotPath = path.resolve(directoryPath, logId + ".jpg")
        await moveFile(uri, finalScreenshotPath)

        const backendUrl = getUploadServerHostUrl()
        if(backendUrl != null){
            const formData = new FormData()
            formData.append("logId", logId)
            formData.append("screenshot", {uri: "file://" + finalScreenshotPath, name: logId + ".jpg", type: "image/jpeg"})

            fetch(path.resolve(backendUrl, "screenshot"), {
                method: "POST",
                headers: {
                    'Content-Type': 'multipart/form-data',
                    sessionid: this.sessionId,
                    instanceuid: getUniqueId()
                },
                body: formData
            }).then(result => {
                console.log("screenshot upload result: ", result.status)
            })
        }
    }

    async exportLogs(): Promise<boolean> {
        if (this.currentLogger) {
            const zipResult = await this.currentLogger.zipLogs()
            if (zipResult) {
                try {
                    const shareResult = await Share.open({
                        url: "file://" + zipResult.filePath,
                        type: zipResult.mimeType,
                        showAppsToView: true
                    })
                    console.log(shareResult)
                    return true
                } catch (e) {
                    console.log(e)
                    return false
                }
            } else return false
        } else return false
    }
}