import {createStore, applyMiddleware} from 'redux';
import {persistStore, persistCombineReducers} from 'redux-persist';
import {measureSettingsStateReducer} from './measure-settings/reducer';
import AsyncStorage from '@react-native-community/async-storage';
import { explorationStateReducer } from './exploration/reducers';
import thunk from 'redux-thunk';

const persistConfig = {
  key: 'root',
  whitelist: ['measureSettingsState'],
  storage: AsyncStorage,
  debug: true
};

export default () => {
  let store = createStore(
    persistCombineReducers(persistConfig, {
      measureSettingsState: measureSettingsStateReducer,
      explorationState: explorationStateReducer
    }),
    applyMiddleware(thunk)
  );
  let persistor = persistStore(store, null, () => {});
  return {store, persistor};
};
