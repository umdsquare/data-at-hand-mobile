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
} from './actions';
import {explorationInfoHelper} from '../../../core/exploration/ExplorationInfoHelper';

export interface ExplorationState {
  info: ExplorationInfo;
  past: Array<ExplorationInfo>;
  future: Array<ExplorationInfo>;
}

const INITIAL_STATE = {
  info: makeInitialStateInfo(),
  past: [],
  future: [],
} as ExplorationState;

export const explorationStateReducer = (
  state: ExplorationState = INITIAL_STATE,
  action: ExplorationAction,
): ExplorationState => {
  const newState: ExplorationState = JSON.parse(JSON.stringify(state));

  if(action.type === ExplorationActionType.Undo || action.type === ExplorationActionType.Redo){
    switch (action.type) {
      case ExplorationActionType.Undo:
        if (state.past.length > 0) {
          newState.future.unshift(newState.info);
          newState.info = newState.past.pop();
          return newState;
        } else return state;
  
      case ExplorationActionType.Redo:
        if (state.future.length > 0) {
          newState.past.push(newState.info)
          newState.info = newState.future.shift()
          return newState
        } else return state;
      }
  }else{

    newState.past.push(JSON.parse(JSON.stringify(newState.info)))
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
          this.getParameterValue(state.info, ParameterType.DataSource);
        const range =
          goToBrowseRangeAction.range ||
          this.getParameterValue(state.info, ParameterType.Range);
        if (dataSource != null && range != null) {
          newState.info.type = ExplorationType.B_Range;
          newState.info.values = [];
          this.setParameterValue(newState.info, range, ParameterType.Range);
          this.setParameterValue(
            newState.info,
            dataSource,
            ParameterType.DataSource,
          );
        }
        break;
      default:
        return state;
    }

    return newState
  }
};
