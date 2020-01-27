import {
  ExplorationInfo,
  makeInitialStateInfo,
  ExplorationType,
  ParameterType,
} from '../../../core/exploration/types';
import {
  ExplorationAction,
  ExplorationActionType,
  SetRangeAction,
  GoToBrowseRangeAction,
  MemoUIStatusAction,
} from './actions';
import {explorationInfoHelper} from '../../../core/exploration/ExplorationInfoHelper';
import {ExplorationDataActionType} from '../data/actions';

export interface ExplorationState {
  info: ExplorationInfo;
  past: Array<ExplorationInfo>;
  future: Array<ExplorationInfo>;
  uiStatus: any;
}

const INITIAL_STATE = {
  info: makeInitialStateInfo(),
  past: [],
  future: [],
  uiStatus: {},
} as ExplorationState;

export const explorationStateReducer = (
  state: ExplorationState = INITIAL_STATE,
  action: ExplorationAction,
): ExplorationState => {
  const newState: ExplorationState = JSON.parse(JSON.stringify(state));

  if (
    action.type === ExplorationActionType.Undo ||
    action.type === ExplorationActionType.Redo ||
    action.type === ExplorationActionType.MemoUiStatus
  ) {
    switch (action.type) {
      case ExplorationActionType.Undo:
        if (state.past.length > 0) {
          newState.future.unshift(newState.info);
          newState.info = newState.past.pop();
          return newState;
        } else return state;

      case ExplorationActionType.Redo:
        if (state.future.length > 0) {
          newState.past.push(newState.info);
          newState.info = newState.future.shift();
          return newState;
        } else return state;

      case ExplorationActionType.MemoUiStatus:
        const memoUiStatusAction = action as MemoUIStatusAction;
        newState.uiStatus[memoUiStatusAction.key] = memoUiStatusAction.value;
        return newState;
    }
  } else {
    newState.past.push(JSON.parse(JSON.stringify(newState.info)));
    newState.future = [];

    switch (action.type) {
      case ExplorationActionType.SetRange:
        const setRangeAction = action as SetRangeAction;
        if (state.info.type === ExplorationType.B_Day) {
          //noop
        } else {
          explorationInfoHelper.setParameterValue(
            newState.info,
            setRangeAction.range,
            ParameterType.Range,
            setRangeAction.key as any,
          );
        }
        break;
      case ExplorationActionType.GoToBrowseRange:
        //check parameters
        const goToBrowseRangeAction = action as GoToBrowseRangeAction;
        const dataSource =
          goToBrowseRangeAction.dataSource ||
          explorationInfoHelper.getParameterValue(
            state.info,
            ParameterType.DataSource,
          );
        const range =
          goToBrowseRangeAction.range ||
          explorationInfoHelper.getParameterValue(
            state.info,
            ParameterType.Range,
          );
        if (dataSource != null && range != null) {
          newState.info.type = ExplorationType.B_Range;
          newState.info.values = [];
          explorationInfoHelper.setParameterValue(
            newState.info,
            range,
            ParameterType.Range,
          );
          explorationInfoHelper.setParameterValue(
            newState.info,
            dataSource,
            ParameterType.DataSource,
          );
        }
        break;
      case ExplorationActionType.GoToBrowseOverview:
        if (newState.info.type === ExplorationType.B_Ovrvw) {
          return state;
        } else {
          explorationInfoHelper.filterParameters(
            newState.info,
            param => param.parameter === ParameterType.Range,
          );
          newState.info.type = ExplorationType.B_Ovrvw;
        }
        break;
      default:
        return state;
    }

    return newState;
  }
};
