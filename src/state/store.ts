import {createStore} from 'redux';
import {persistStore, persistCombineReducers} from 'redux-persist';
import {measureSettingsStateReducer} from './measure-settings/reducer';
import AsyncStorage from '@react-native-community/async-storage';

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
    }),
  );
  let persistor = persistStore(store, null, () => {});
  return {store, persistor};
};
