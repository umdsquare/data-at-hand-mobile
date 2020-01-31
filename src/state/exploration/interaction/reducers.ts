import {
  ExplorationInfo,
  makeInitialStateInfo,
  ExplorationType,
  ParameterType,
  TouchingElementInfo,
} from '../../../core/exploration/types';
import {
  ExplorationAction,
  ExplorationActionType,
  SetRangeAction,
  GoToBrowseRangeAction,
  MemoUIStatusAction,
  SetDataSourceAction,
  SetTouchingElementInfoAction,
  InteractionType,
  GoToBrowseDayAction,
} from './actions';
import {explorationInfoHelper} from '../../../core/exploration/ExplorationInfoHelper';

var deepEqual = require('deep-equal');

export interface ExplorationState {
  info: ExplorationInfo;
  prevInfo: ExplorationInfo;
  backNavStack: Array<ExplorationInfo>;
  uiStatus: {[key: string]: any};
  touchingElement: TouchingElementInfo;
}

const INITIAL_STATE = {
  info: makeInitialStateInfo(),
  prevInfo: null,
  backNavStack: [],
  uiStatus: {},
  touchingElement: null,
} as ExplorationState;

export const explorationStateReducer = (
  state: ExplorationState = INITIAL_STATE,
  action: ExplorationAction,
): ExplorationState => {
  const newState: ExplorationState = {
    info: JSON.parse(JSON.stringify(state.info)),
    prevInfo: state.prevInfo,
    backNavStack: state.backNavStack.slice(0),
    uiStatus: state.uiStatus,
    touchingElement: state.touchingElement,
  };

  if (
    action.type === ExplorationActionType.RestorePreviousInfo ||
    action.type === ExplorationActionType.GoBack ||
    action.type === ExplorationActionType.MemoUiStatus ||
    action.type === ExplorationActionType.SetTouchElementInfo
  ) {
    switch (action.type) {
      case ExplorationActionType.RestorePreviousInfo:
        if (state.prevInfo) {
          newState.info = newState.prevInfo;
          newState.prevInfo = null;
          if (newState.backNavStack.length > 0) {
            if (
              deepEqual(
                newState.info,
                newState.backNavStack[newState.backNavStack.length - 1],
              ) === true
            ) {
              newState.backNavStack.pop();
            }
          }
          return newState;
        } else return state;

      case ExplorationActionType.GoBack:
        if (state.backNavStack.length > 0) {
          newState.info = newState.backNavStack.pop();
          newState.prevInfo = null;
          return newState;
        } else return state;
      case ExplorationActionType.MemoUiStatus:
        const memoUiStatusAction = action as MemoUIStatusAction;
        newState.uiStatus = {...state.uiStatus};
        newState.uiStatus[memoUiStatusAction.key] = memoUiStatusAction.value;
        return newState;
      case ExplorationActionType.SetTouchElementInfo:
        const setTouchElementInfoAction = action as SetTouchingElementInfoAction;
        newState.touchingElement = setTouchElementInfoAction.info;
        return newState;
    }
  } else {
    if (action['interactionType'] === InteractionType.Multimodal) {
      newState.prevInfo = JSON.parse(JSON.stringify(newState.info));
    }

    switch (action.type) {
      case ExplorationActionType.SetRange:
        const setRangeAction = action as SetRangeAction;
        if (state.info.type === ExplorationType.B_Day) {
          return state;
        } else {
          explorationInfoHelper.setParameterValue(
            newState.info,
            setRangeAction.range,
            ParameterType.Range,
            setRangeAction.key as any,
          );
        }
        break;
      case ExplorationActionType.SetDataSource:
        const setDataSourceAction = action as SetDataSourceAction;
        if (state.info.type === ExplorationType.B_Ovrvw) {
          return state;
        } else {
          explorationInfoHelper.setParameterValue(
            newState.info,
            setDataSourceAction.dataSource,
            ParameterType.DataSource,
          );
        }
        break;
      case ExplorationActionType.GoToBrowseRange:
        //check parameters
        const goToBrowseRangeAction = action as GoToBrowseRangeAction;
        {
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
        }
        break;
      case ExplorationActionType.GoToBrowseDay:
        const goToBrowseDayAction = action as GoToBrowseDayAction;
        {
          const dataSource =
            goToBrowseDayAction.dataSource ||
            explorationInfoHelper.getParameterValue(
              state.info,
              ParameterType.DataSource,
            );
          const date =
            goToBrowseDayAction.date ||
            explorationInfoHelper.getParameterValue(
              state.info,
              ParameterType.Date,
            );
          if (dataSource != null && date != null) {
            newState.info.type = ExplorationType.B_Day;
            newState.info.values = [];
            explorationInfoHelper.setParameterValue(
              newState.info,
              dataSource,
              ParameterType.DataSource,
            );
            explorationInfoHelper.setParameterValue(
              newState.info,
              date,
              ParameterType.Date,
            );
          }
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

    if (newState.info.type != state.info.type) {
      newState.backNavStack.push(JSON.parse(JSON.stringify(state.info)));
    }

    return newState;
  }
};
