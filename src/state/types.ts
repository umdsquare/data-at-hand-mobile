import { SettingsState } from "./settings/reducer";
import { ExplorationState } from "./exploration/interaction/reducers";
import { ExplorationDataState } from "./exploration/data/reducers";
import { SpeechRecognizerState } from "./speech/types";


export type ReduxAppState = {
    settingsState: SettingsState,
    explorationState: ExplorationState,
    explorationDataState: ExplorationDataState,
    speechRecognizerState: SpeechRecognizerState
}

export interface ActionTypeBase{
    type: string
}