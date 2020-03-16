import { MiddlewareAPI, Dispatch } from "redux"
import { ActionTypeBase, ReduxAppState } from "./types"
import { USER_INTERACTION_ACTION_PREFIX, ExplorationActionType } from "./exploration/interaction/actions"
import { SystemLogger } from "@core/logging/SystemLogger"

export const makeLogger = () => {
    return (api: MiddlewareAPI) => (next: Dispatch) => (action: ActionTypeBase) => {

        if (action.type.startsWith(USER_INTERACTION_ACTION_PREFIX) || action.type === ExplorationActionType.Reset) {
            //
            const prevState: ReduxAppState = api.getState()
            const returnedValue = next(action)
            const nextState: ReduxAppState = api.getState()

            const prevExplorationState = prevState.explorationState
            const nextExplorationState = nextState.explorationState

            if (action.type === ExplorationActionType.Reset) {
                SystemLogger.instance
                    .logVerboseToInteractionStateTransition("Reset", {
                        info: nextExplorationState.info,
                        service: nextState.settingsState.serviceKey
                    }).then()
            } else {
                SystemLogger.instance
                    .logInteractionStateTransition(prevState.settingsState.serviceKey, action, nextExplorationState.info).then()
            }

            return returnedValue
        } else return next(action)
    }
}





