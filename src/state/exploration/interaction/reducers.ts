import {
  ExplorationInfo,
  makeInitialStateInfo,
  ExplorationType,
  ParameterType,
  TouchingElementInfo,
  inferIntraDayDataSourceType,
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
  SetDateAction,
  SetIntraDayDataSourceAction,
  GoToComparisonCyclicAction,
  SetCycleTypeAction,
} from './actions';
import {explorationInfoHelper} from '../../../core/exploration/ExplorationInfoHelper';
import { startOfDay, subDays, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { DateTimeHelper } from '../../../time';

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
      case ExplorationActionType.SetDate:
        const setDateAction = action as SetDateAction;
        explorationInfoHelper.setParameterValue(
          newState.info,
          setDateAction.date,
          ParameterType.Date,
        );
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
      case ExplorationActionType.SetIntraDayDataSource:
        const setIntraDayDataSourceAction = action as SetIntraDayDataSourceAction;
        explorationInfoHelper.setParameterValue(
          newState.info,
          setIntraDayDataSourceAction.intraDayDataSource,
          ParameterType.IntraDayDataSource,
        );
        break;

      case ExplorationActionType.SetCycleType:
        const setCycleTypeAction = action as SetCycleTypeAction
        explorationInfoHelper.setParameterValue(
          newState.info,
          setCycleTypeAction.cycleType,
          ParameterType.CycleType
        )
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
            goToBrowseDayAction.intraDayDataSource ||
            explorationInfoHelper.getParameterValue(
              state.info,
              ParameterType.IntraDayDataSource,
            ) || inferIntraDayDataSourceType(explorationInfoHelper.getParameterValue(state.info, ParameterType.DataSource))

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
              ParameterType.IntraDayDataSource,
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

          const currentRange = explorationInfoHelper.getParameterValue(newState.info, ParameterType.Range)
          if(currentRange == null){
            const dateParam = explorationInfoHelper.getParameterValue<number>(newState.info, ParameterType.Date)
            if(dateParam != null){
              const date = DateTimeHelper.toDate(dateParam)
              explorationInfoHelper.setParameterValue(newState.info, [
                DateTimeHelper.toNumberedDateFromDate(startOfWeek(date)),
                DateTimeHelper.toNumberedDateFromDate(endOfWeek(date)),
              ], ParameterType.Range)
            }else{
              const now = startOfDay(new Date());
              explorationInfoHelper.setParameterValue(newState.info, [
                DateTimeHelper.toNumberedDateFromDate(subDays(now, 7)),
                DateTimeHelper.toNumberedDateFromDate(endOfDay(now)),
              ], ParameterType.Range)
            }
          }
          
          explorationInfoHelper.filterParameters(
            newState.info,
            param => param.parameter === ParameterType.Range,
          );

          
          newState.info.type = ExplorationType.B_Ovrvw;
        }
        break;

      case ExplorationActionType.GoToComparisonCyclic:
        const comparisonCyclicAction = action as GoToComparisonCyclicAction
        {
          const dataSource = comparisonCyclicAction.dataSource || explorationInfoHelper.getParameterValue(newState.info, ParameterType.DataSource)
          const range = comparisonCyclicAction.range || explorationInfoHelper.getParameterValue(newState.info, ParameterType.Range)
          const cycleType = comparisonCyclicAction.cycleType || explorationInfoHelper.getParameterValue(newState.info, ParameterType.CycleType)
          if(dataSource && range && cycleType){
            newState.info.type = ExplorationType.C_Cyclic
            newState.info.values = []
            explorationInfoHelper.setParameterValue(newState.info, dataSource, ParameterType.DataSource)
            explorationInfoHelper.setParameterValue(newState.info, range, ParameterType.Range)
            explorationInfoHelper.setParameterValue(newState.info, cycleType, ParameterType.CycleType)
          }else return state
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
