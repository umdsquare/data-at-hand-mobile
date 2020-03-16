import { FileLogger } from "./FileLogger"
import { ExplorationInfo } from "@core/exploration/types"
import { SpeechContext } from "@core/speech/nlp/context"
import { ActionTypeBase } from "@state/types"
import Share from 'react-native-share'

enum LogFileName {
    SpeechCommandLogs = "speech_command.jsonl",

}

export class SystemLogger {
    private static _instance: SystemLogger | undefined = undefined

    static get instance(): SystemLogger {
        if (this._instance == null) {
            this._instance = new SystemLogger()
        }
        return this._instance
    }

    private constructor() { }

    private _sessionId: string | null = null
    private currentLogger: FileLogger | null = null

    public enabled = false

    set sessionId(id: string) {
        console.log("set logging session id: ", id)
        this._sessionId = id;
        if(id){
            this.currentLogger = new FileLogger("logs/" + id)
        }else{
            this.currentLogger = null
        }
    }

    get sessionId(): string | null {
        return this._sessionId
    }

    async clearLogsInCurrentSession(): Promise<void> {
        if (this.currentLogger) {
            await this.currentLogger.removeAllFilesInDirectory()
        }
    }

    async logSpeechCommandResult(text: string, explorationInfo: ExplorationInfo, context: SpeechContext, resultingAction: ActionTypeBase): Promise<void> {
        if (this.currentLogger && this.enabled === true) {
            const normalizedParams: any = {}
            explorationInfo.values.forEach(v => {
                normalizedParams[v.parameter] = v.value
            })
            await this.currentLogger.appendJsonLine(LogFileName.SpeechCommandLogs,
                {
                    inputText: text,
                    invokedExplorationType: explorationInfo.type,
                    invokedExplorationParameters: normalizedParams,
                    speechContext: context,
                    resultingAction
                })
        } else return;
    }

    async exportLogs(): Promise<boolean>{
        if(this.currentLogger){
            const zipResult = await this.currentLogger.zipLogs()
            if(zipResult){
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
            }else return false
        }else return false
    }
}