import {createStore, applyMiddleware} from 'redux';
import {persistStore, persistCombineReducers} from 'redux-persist';
import {settingsStateReducer} from './settings/reducer';
import AsyncStorage from '@react-native-community/async-storage';
import { explorationStateReducer } from './exploration/interaction/reducers';
import {explorationDataStateReducer} from './exploration/data/reducers';
import thunk from 'redux-thunk';
import { speechRecognizerStateReducer } from './speech/reducers';

const persistConfig = {
  key: 'root',
  whitelist: ['settingsState'],
  storage: AsyncStorage,
  debug: true
};

export default () => {
  let store = createStore(
    persistCombineReducers(persistConfig, {
      settingsState: settingsStateReducer,
      explorationState: explorationStateReducer,
      explorationDataState: explorationDataStateReducer,
      speechRecognizerState: speechRecognizerStateReducer
    }),
    applyMiddleware(thunk)
  );
  let persistor = persistStore(store, null, () => {});
  return {store, persistor};
};
