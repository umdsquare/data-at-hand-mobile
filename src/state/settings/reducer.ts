import {
  SettingsActionTypes,
  SetServiceAction,
  SetUnitTypeAction,
  SetRecordLogsAction,
} from '@state/settings/actions';
import { MeasureUnitType } from '@measure/DataSourceSpec';
import { ActionTypeBase } from '@state/types';
import { randomString } from '@utils/utils';

export interface SettingsState {
  serviceKey: string,
  serviceInitialDate?: number,
  unit: MeasureUnitType,
  recordLogs: boolean,
  loggingSessionId?: string
}

const INITIAL_STATE = {
  serviceKey: 'fitbit',
  serviceInitialDate: undefined,
  unit: MeasureUnitType.Metric,
  recordLogs: false,
  loggingSessionId: undefined
} as SettingsState;

export const settingsStateReducer = (
  state: SettingsState = INITIAL_STATE,
  action: ActionTypeBase,
): SettingsState => {
  const newState: SettingsState = {
    ...state
  };
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

    case SettingsActionTypes.SetRecordLogs:
      {
        const a = action as SetRecordLogsAction
        if(newState.recordLogs !== a.recordLogs || newState.loggingSessionId !== a.sessionId){
          newState.recordLogs = a.recordLogs
          newState.loggingSessionId = a.sessionId

          if(state.recordLogs=== false && a.recordLogs === true && newState.loggingSessionId == null){
            //cold start of the logging
            const id = randomString(10) + "_" + Date.now()
            console.log("Start recording logs in session id", id)
            newState.loggingSessionId = id
          }
          return newState;
        }else return state
      }
    default:
      return state;
  }
};

function setServiceImpl(
  state: SettingsState,
  action: SetServiceAction
) {
  state.serviceKey = action.serviceKey
  state.serviceInitialDate = action.serviceInitialDate
}

function setUnitTypeImpl(
  state: SettingsState,
  action: SetUnitTypeAction
) {
  state.unit = action.unitType
}
