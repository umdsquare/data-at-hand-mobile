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
} from './actions';
import {explorationInfoHelper} from '../../../core/exploration/ExplorationInfoHelper';

export interface ExplorationState {
  info: ExplorationInfo;
  past: Array<ExplorationInfo>;
  future: Array<ExplorationInfo>;
  uiStatus: {[key:string]:any};
  touchingElement: TouchingElementInfo
}

const INITIAL_STATE = {
  info: makeInitialStateInfo(),
  past: [],
  future: [],
  uiStatus: {},
  touchingElement: null
} as ExplorationState;

export const explorationStateReducer = (
  state: ExplorationState = INITIAL_STATE,
  action: ExplorationAction,
): ExplorationState => {

  const newState: ExplorationState = {
    info: JSON.parse(JSON.stringify(state.info)),
    past: state.past.slice(0),
    future: state.future.slice(0),
    uiStatus: state.uiStatus,
    touchingElement: state.touchingElement
  }

  if (
    action.type === ExplorationActionType.Undo ||
    action.type === ExplorationActionType.Redo ||
    action.type === ExplorationActionType.MemoUiStatus ||
    action.type === ExplorationActionType.SetTouchElementInfo
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
        newState.uiStatus = {...state.uiStatus}
        newState.uiStatus[memoUiStatusAction.key] = memoUiStatusAction.value;
        return newState;
      case ExplorationActionType.SetTouchElementInfo:
        const setTouchElementInfoAction = action as SetTouchingElementInfoAction
        newState.touchingElement = setTouchElementInfoAction.info
        return newState;
    }
  } else {
    newState.past.push(JSON.parse(JSON.stringify(newState.info)));
    newState.future = [];

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
            ParameterType.DataSource
          )
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
