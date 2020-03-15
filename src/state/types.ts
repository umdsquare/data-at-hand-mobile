import { SettingsState } from "@state/settings/reducer";
import { ExplorationState } from "@state/exploration/interaction/reducers";
import { ExplorationDataState } from "@state/exploration/data/reducers";
import { SpeechRecognizerState } from "@state/speech/types";


export type ReduxAppState = {
    settingsState: SettingsState,
    explorationState: ExplorationState,
    explorationDataState: ExplorationDataState,
    speechRecognizerState: SpeechRecognizerState
}

export interface ActionTypeBase{
    type: string
}