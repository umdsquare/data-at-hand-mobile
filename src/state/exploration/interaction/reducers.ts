import {
  ExplorationInfo,
  makeInitialStateInfo,
  ExplorationType,
  ParameterType,
} from '../../../core/exploration/types';
import { ExplorationAction, ExplorationActionType, SetRangeAction, GoToBrowseRangeAction } from './actions';
import { explorationInfoHelper } from '../../../core/exploration/ExplorationInfoHelper';

export interface ExplorationState {
  info: ExplorationInfo;
}

const INITIAL_STATE = {
  info: makeInitialStateInfo()
} as ExplorationState;

export const explorationStateReducer = (
  state: ExplorationState = INITIAL_STATE,
  action: ExplorationAction,
): ExplorationState => {
  const newState: ExplorationState = JSON.parse(JSON.stringify(state));

  switch (action.type) {
    case ExplorationActionType.SetRange:
      const setRangeAction = action as SetRangeAction
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
      return newState
    case ExplorationActionType.GoToBrowseRange:
      //check parameters
      const goToBrowseRangeAction = action as GoToBrowseRangeAction
      const dataSource = goToBrowseRangeAction.dataSource || this.getParameterValue(state.info, ParameterType.DataSource)
      const range = goToBrowseRangeAction.range || this.getParameterValue(state.info, ParameterType.Range)
      if(dataSource != null && range != null){
        newState.info.type = ExplorationType.B_Range
        newState.info.values = []
        this.setParameterValue(newState.info, range, ParameterType.Range)
        this.setParameterValue(newState.info, dataSource, ParameterType.DataSource)
      }
      return newState
    default:
      return state;
  }
};