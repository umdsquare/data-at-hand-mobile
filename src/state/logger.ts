import { MiddlewareAPI, Dispatch } from "redux"
import { ActionTypeBase, ReduxAppState } from "./types"
import { USER_INTERACTION_ACTION_PREFIX, ExplorationActionType } from "./exploration/interaction/actions"
import { SystemLogger } from "@core/logging/SystemLogger"
import { captureScreen } from "react-native-view-shot";
import { moveFile, exists, mkdir } from "react-native-fs";
import { randomString } from "@utils/utils";
import path from 'react-native-path'
import { Dimensions, PixelRatio } from "react-native";
import { SettingsActionTypes, SetRecordLogsAction } from "./settings/actions";

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
                    .logInteractionStateTransition(prevState.settingsState.serviceKey, action, nextExplorationState.info, logId, timestamp).then()
            }

            if (prevState.settingsState.recordLogs === true && prevState.settingsState.recordScreens === true) {
                setTimeout(() => {
                    const pixelRatio = PixelRatio.get();
                    const imageWidth = 300;
                    const imageHeight = imageWidth * Dimensions.get('screen').height / Dimensions.get('screen').width
                    captureScreen({
                        format: 'jpg',
                        quality: 0.5,
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
                }, 1000)
            }

            return returnedValue
        } else if (action.type === SettingsActionTypes.SetRecordLogs) {
            const a = action as SetRecordLogsAction
            if (prevState.settingsState.recordLogs !== a.recordLogs) {
                const timestamp = Date.now();
                const logId = SystemLogger.instance.makeLogId(timestamp);

                if(a.recordLogs === true){
                    //turn on
                    //turn on then log
                    const returnedValue = next(action)

                    SystemLogger.instance
                    .logVerboseToInteractionStateTransition("LoggingTurnedOn", {
                        info: prevState.explorationState.info,
                        service: prevState.settingsState.serviceKey
                    }, logId, timestamp).then()

                    return returnedValue
                }else {
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

        } else return next(action)
    }
}





