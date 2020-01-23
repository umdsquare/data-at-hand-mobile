import {
  MeasureSettingsAction as SettingsAction,
  SettingsActionTypes,
  SetServiceAction,
  SetUnitTypeAction,
} from './actions';
import {MeasureUnitType} from '../../measure/DataSourceSpec';

export interface SettingsState {
  serviceKey: string,
  serviceInitialDate: number,
  unit: MeasureUnitType
}

const INITIAL_STATE = {
  serviceKey: 'fitbit',
  serviceInitialDate: null,
  unit: MeasureUnitType.Metric
} as SettingsState;

export const settingsStateReducer = (
  state: SettingsState = INITIAL_STATE,
  action: SettingsAction,
): SettingsState => {
  const newState: SettingsState = JSON.parse(JSON.stringify(state));
  switch (action.type) {
    case SettingsActionTypes.SetService:
      setServiceImpl(
        newState,
        action as SetServiceAction,
      );
      return newState;
    case SettingsActionTypes.SetUnitType:
      setUnitTypeImpl(newState, action as SetUnitTypeAction)
      return newState;
    default:
      return state;
  }
};

function setServiceImpl(
  state: SettingsState,
  action: SetServiceAction
){
  state.serviceKey = action.serviceKey
  state.serviceInitialDate = action.serviceInitialDate
}

function setUnitTypeImpl(
  state: SettingsState,
  action: SetUnitTypeAction
){
  state.unit = action.unitType
}
