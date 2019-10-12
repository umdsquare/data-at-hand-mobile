import { createStore, combineReducers } from 'redux';
import { AppState } from './types';
import { measureSettingsStateReducer } from './measure-settings/reducer';

export const makeStore = () => createStore(combineReducers<AppState>({
    measureSettingsState: measureSettingsStateReducer
}))
