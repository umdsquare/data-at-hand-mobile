import { MiddlewareAPI, Dispatch } from "redux"
import { ActionTypeBase, ReduxAppState } from "@state/types"
import { USER_INTERACTION_ACTION_PREFIX, ExplorationActionType } from "@state/exploration/interaction/actions"
import { SystemLogger } from "@core/logging/SystemLogger"
import { captureScreen } from "react-native-view-shot";
import { moveFile, exists, mkdir } from "react-native-fs";
import path from 'react-native-path'
import { Dimensions, PixelRatio, Platform } from "react-native";
import { SettingsActionTypes, SetRecordLogsAction } from "@state/settings/actions";
import { ExplorationDataActionType } from "./exploration/data/actions";

const whitelistForScreenshot = [ExplorationActionType.SetTouchElementInfo];

let logIdForScreenshot: string | null = null;
let screenshotTimeout: NodeJS.Timeout | null = null;

export const makeLogger = () => {
    return (api: MiddlewareAPI) => (next: Dispatch) => (action: ActionTypeBase) => {

        const prevState: ReduxAppState = api.getState()
        if (prevState.settingsState.recordLogs === true && (action.type.startsWith(USER_INTERACTION_ACTION_PREFIX) || action.type === ExplorationActionType.Reset)) {
            //
            const returnedValue = next(action)
            const nextState: ReduxAppState = api.getState()
            const nextExplorationState = nextState.explorationState

            const timestamp = Date.now();
            const logId = SystemLogger.instance.makeLogId(timestamp);

            if (action.type === ExplorationActionType.Reset) {
                SystemLogger.instance
                    .logVerboseToInteractionStateTransition("Reset", {
                        info: nextExplorationState.info,
                        service: nextState.settingsState.serviceKey
                    }, logId, timestamp).then()
            } else {
                SystemLogger.instance
                    .logInteractionStateTransition(prevState.settingsState.serviceKey, action, action.type === ExplorationActionType.SetTouchElementInfo ? undefined : nextExplorationState.info, logId, timestamp).then()
            }

            if (prevState.settingsState.recordLogs === true && prevState.settingsState.recordScreens === true && whitelistForScreenshot.indexOf(action.type as any) === -1) {
                logIdForScreenshot = logId
            }

            return returnedValue
        } else if (action.type === SettingsActionTypes.SetRecordLogs) {
            const a = action as SetRecordLogsAction
            if (prevState.settingsState.recordLogs !== a.recordLogs) {
                const timestamp = Date.now();
                const logId = SystemLogger.instance.makeLogId(timestamp);

                if (a.recordLogs === true) {
                    //turn on
                    //turn on then log
                    const returnedValue = next(action)

                    SystemLogger.instance
                        .logVerboseToInteractionStateTransition("LoggingTurnedOn", {
                            info: prevState.explorationState.info,
                            service: prevState.settingsState.serviceKey
                        }, logId, timestamp).then()

                    return returnedValue
                } else {
                    //turn off
                    SystemLogger.instance
                        .logVerboseToInteractionStateTransition("LoggingTurnedOff", {
                            info: prevState.explorationState.info,
                            service: prevState.settingsState.serviceKey
                        }, logId, timestamp).then()

                    return next(action)
                }


            }

            return next(action)

        } else if (action.type === ExplorationDataActionType.FinishLoadingDataAction && logIdForScreenshot != null) {
            if(screenshotTimeout){
                console.log("skip the previous screenshot task.")
                clearTimeout(screenshotTimeout)
            }

            const logId = logIdForScreenshot
            logIdForScreenshot = null

            screenshotTimeout = setTimeout(() => {
                const pixelRatio = PixelRatio.get();
                const imageWidth = 300;

                const screenDimension = Dimensions.get('window')
                const imageHeight = imageWidth * screenDimension.height / screenDimension.width
                captureScreen({
                    format: 'jpg',
                    quality: Platform.OS == 'ios'? 0.5 : 1,
                    width: Math.round(imageWidth / pixelRatio),
                    height: Math.round(imageHeight / pixelRatio)
                }).then(async uri => {
                    const directoryPath = path.resolve(SystemLogger.instance.logDirectoryPath, "screens")
                    const directoryExists = await exists(directoryPath)
                    if (directoryExists === false) {
                        await mkdir(directoryPath)
                    }

                    return moveFile(uri, path.resolve(directoryPath, logId + ".jpg"))
                }, error => {
                    console.log("Screenshot error: ", error)
                }).then()
                logIdForScreenshot = null
                screenshotTimeout = null
            }, 600)

            return next(action);
        } else return next(action)
    }
}





