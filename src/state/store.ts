import { createStore, applyMiddleware } from 'redux';
import { persistStore, persistCombineReducers } from 'redux-persist';
import { settingsStateReducer, SettingsState } from '@state/settings/reducer';
import AsyncStorage from '@react-native-community/async-storage';
import { explorationStateReducer } from '@state/exploration/interaction/reducers';
import { explorationDataStateReducer } from '@state/exploration/data/reducers';
import thunk from 'redux-thunk';
import { speechRecognizerStateReducer } from '@state/speech/reducers';
import { SystemLogger } from '@core/logging/SystemLogger';

const persistConfig = {
  key: 'root',
  whitelist: ['settingsState'],
  storage: AsyncStorage,
  debug: true
};

export default () => {
  const store = createStore(
    persistCombineReducers(persistConfig, {
      settingsState: settingsStateReducer,
      explorationState: explorationStateReducer,
      explorationDataState: explorationDataStateReducer,
      speechRecognizerState: speechRecognizerStateReducer
    }),
    applyMiddleware(thunk)
  );


  let currentSettingsState: SettingsState | undefined = undefined
  store.subscribe(() => {
    const prevSettingsState = currentSettingsState
    currentSettingsState = store.getState().settingsState
    if (prevSettingsState == null
      || prevSettingsState.loggingSessionId !== currentSettingsState.loggingSessionId
      || prevSettingsState.recordLogs !== currentSettingsState.recordLogs) {
      SystemLogger.instance.sessionId = currentSettingsState.loggingSessionId
      SystemLogger.instance.enabled = currentSettingsState.recordLogs
    }
  })

  const persistor = persistStore(store, null, () => { });
  return { store, persistor };
};
