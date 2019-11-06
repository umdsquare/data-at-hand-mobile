import {
  ExplorationStateInfo,
  ExplorationStateType,
  ExplorationCommand,
} from '../../core/interaction/types';
import {ActionTypeBase} from '../types';
import {Dispatch} from 'redux';
import {ExplorationStateActionTypes, FinishStateTransition} from './actions';
import {sleep} from '../../utils';
import {explorationStateResolver} from '../../core/interaction/ExplorationStateResolver';

export interface ExplorationState {
  info: ExplorationStateInfo;
  isProcessing: boolean;
  error: any;
}

const INITIAL_STATE = {
  info: {
    stateType: ExplorationStateType.Initial,
    payload: null,
  },
  isProcessing: false,
  error: null,
} as ExplorationState;

export const explorationStateReducer = (
  state: ExplorationState = INITIAL_STATE,
  action: ActionTypeBase,
): ExplorationState => {

  const newState: ExplorationState = JSON.parse(JSON.stringify(state));

  switch (action.type) {
    case ExplorationStateActionTypes.FinishStateTransition:
      const castedAction = action as FinishStateTransition;
      newState.isProcessing = false;
      if (castedAction.error) {
        newState.error = castedAction.error;
      } else {
        newState.error = null;
        newState.info = castedAction.newStateInfo;
      }
      return newState;
    case ExplorationStateActionTypes.StartStateTransition:
      newState.isProcessing = true;
      return newState;
    default:
      return state;
  }
};

export function resolveExplorationCommand(command: ExplorationCommand) {
  return runAsyncStateUpdateTask((stateInfo: ExplorationStateInfo) =>
    explorationStateResolver.getNewStateInfo(stateInfo, command),
  );
}

function runAsyncStateUpdateTask(
  getNewStateFunc: (ExplorationStateInfo) => Promise<ExplorationStateInfo>,
) {
  return async (dispatch: Dispatch, getState: () => ExplorationState) => {
    dispatch({
      type: ExplorationStateActionTypes.StartStateTransition,
    });
    try {
      const newStateInfo = await getNewStateFunc(getState().info);
      dispatch({
        type: ExplorationStateActionTypes.FinishStateTransition,
        newStateInfo: newStateInfo,
        error: null,
      } as FinishStateTransition);
    } catch (error) {
      dispatch({
        newStateInfo: null,
        error: error,
      } as FinishStateTransition);
    }
  };
}
