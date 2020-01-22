import {
  ExplorationInfo,
  makeInitialStateInfo,
} from '../../../core/exploration/types';
import {ActionTypeBase, ReduxAppState} from '../../types';
import {Dispatch} from 'redux';
import {ExplorationStateActionTypes, FinishStateTransition} from './actions';
import {explorationCommandResolver} from '../../../core/exploration/ExplorationCommandResolver';
import {ExplorationCommand} from '../../../core/exploration/commands';

export interface ExplorationState {
  info: ExplorationInfo;
  isProcessing: boolean;
  error: any;
}

const INITIAL_STATE = {
  info: makeInitialStateInfo(),
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
  return async (dispatch: Dispatch, getState: () => ReduxAppState) => {
    dispatch({
      type: ExplorationStateActionTypes.StartStateTransition,
      command: command
    });
    try {
      const state = getState();
      const newStateInfo = await explorationCommandResolver.getNewStateInfo(state.explorationState.info, command);
      dispatch({
        type: ExplorationStateActionTypes.FinishStateTransition,
        newStateInfo: newStateInfo,
        error: null,
      } as FinishStateTransition);
    } catch (error) {
      console.error(error);
      dispatch({
        type: ExplorationStateActionTypes.FinishStateTransition,
        newStateInfo: null,
        error: error,
      } as FinishStateTransition);
    }
  };
}
