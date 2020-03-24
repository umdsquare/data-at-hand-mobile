import {
  ExplorationInfo,
  makeInitialStateInfo,
  ExplorationType,
  ParameterType,
  TouchingElementInfo,
  inferIntraDayDataSourceType,
  ParameterKey,
  shallowCopyExplorationInfo,
} from '@core/exploration/types';
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
  GoToComparisonTwoRangesAction,
  GoToCyclicDetailAction,
  SetCycleDimensionAction,
  ShiftAllRangesAction,
  SetHighlightFilterAction,
  ResetAction,
} from '@state/exploration/interaction/actions';
import { explorationInfoHelper } from '@core/exploration/ExplorationInfoHelper';
import { startOfDay, subDays, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { DateTimeHelper } from '@utils/time';
import { DataSourceType } from '@measure/DataSourceSpec';

export interface ExplorationState {
  info: ExplorationInfo;
  prevInfo: ExplorationInfo | null | undefined;
  backNavStack: Array<ExplorationInfo>;
  uiStatus: { [key: string]: any };
  touchingElement: TouchingElementInfo | null | undefined;
}

const INITIAL_STATE = {
  info: null,
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
    info: state.info != null? shallowCopyExplorationInfo(state.info) : null,
    prevInfo: null,
    backNavStack: state.backNavStack.slice(0),
    uiStatus: state.uiStatus,
    touchingElement: state.touchingElement,
  };

  if (
    action.type === ExplorationActionType.RestorePreviousInfo ||
    action.type === ExplorationActionType.GoBack ||
    action.type === ExplorationActionType.MemoUiStatus ||
    action.type === ExplorationActionType.SetTouchElementInfo ||
    action.type === ExplorationActionType.Reset
  ) {
    switch (action.type) {
      case ExplorationActionType.RestorePreviousInfo:
        if (state.prevInfo) {
          newState.info = shallowCopyExplorationInfo(state.prevInfo)!;
          newState.prevInfo = null;
          if (newState.backNavStack.length > 0) {
            if (
              explorationInfoHelper.equals(
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
          newState.info = newState.backNavStack.pop()!;
          newState.prevInfo = null;
          return newState;
        } else return state;
      case ExplorationActionType.MemoUiStatus:
        const memoUiStatusAction = action as MemoUIStatusAction;
        newState.uiStatus = { ...state.uiStatus };
        newState.uiStatus[memoUiStatusAction.key] = memoUiStatusAction.value;
        return newState;
      
      case ExplorationActionType.SetTouchElementInfo:
        const setTouchElementInfoAction = action as SetTouchingElementInfoAction;
        newState.touchingElement = setTouchElementInfoAction.info;
        return newState;

      case ExplorationActionType.Reset:
        {
          const a = action as ResetAction;
          //clear all information
          newState.backNavStack = []
          newState.prevInfo = null
          newState.touchingElement = null
          newState.uiStatus = {}
          newState.info = makeInitialStateInfo();
          explorationInfoHelper.setParameterValue(newState.info, a.resetRange, ParameterType.Range)
          return newState;
        }
    }
  } else {
    if ((action as any)['interactionType'] === InteractionType.Speech) {
      newState.prevInfo = shallowCopyExplorationInfo(newState.info);
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
        if (state.info.type === ExplorationType.B_Overview) {
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
        const setCycleTypeAction = action as SetCycleTypeAction;
        explorationInfoHelper.setParameterValue(
          newState.info,
          setCycleTypeAction.cycleType,
          ParameterType.CycleType,
        );
        break;

      case ExplorationActionType.SetCycleDimension:
        const setCycleDimensionAction = action as SetCycleDimensionAction;
        explorationInfoHelper.setParameterValue(
          newState.info,
          setCycleDimensionAction.cycleDimension,
          ParameterType.CycleDimension
        )
        break;

      case ExplorationActionType.SetHighlightFilter:
        {
          const a = action as SetHighlightFilterAction
          console.log("update filter:", a.highlightFilter)
          newState.info.highlightFilter = a.highlightFilter
        }
        break;

      case ExplorationActionType.ShiftAllRanges:
        {
          const a = action as ShiftAllRangesAction

          if (newState.info.type === ExplorationType.C_TwoRanges) {

            const rangeA = explorationInfoHelper.getParameterValue<[number, number]>(
              newState.info,
              ParameterType.Range,
              ParameterKey.RangeA,
            );
            if (rangeA != null) {
              explorationInfoHelper.setParameterValue(newState.info, DateTimeHelper.pageRange(rangeA[0], rangeA[1], a.direction === 'future' ? 1 : -1), ParameterType.Range, ParameterKey.RangeA)
            }

            const rangeB =
              explorationInfoHelper.getParameterValue<[number, number]>(
                newState.info,
                ParameterType.Range,
                ParameterKey.RangeB,
              );
            if (rangeB != null) {
              explorationInfoHelper.setParameterValue(newState.info, DateTimeHelper.pageRange(rangeB[0], rangeB[1], a.direction === 'future' ? 1 : -1), ParameterType.Range, ParameterKey.RangeB)
            }
          } else {
            const range = explorationInfoHelper.getParameterValue<[number, number]>(newState.info, ParameterType.Range, null)
            if (range != null) {
              explorationInfoHelper.setParameterValue(newState.info, DateTimeHelper.pageRange(range[0], range[1], a.direction === 'future' ? 1 : -1), ParameterType.Range)
            }
          }

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
            goToBrowseDayAction.intraDayDataSource ||
            explorationInfoHelper.getParameterValue(
              state.info,
              ParameterType.IntraDayDataSource,
            ) ||
            inferIntraDayDataSourceType(
              explorationInfoHelper.getParameterValue(
                state.info,
                ParameterType.DataSource,
              ) || DataSourceType.StepCount,
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
        if (newState.info.type === ExplorationType.B_Overview) {
          return state;
        } else {
          const currentRange = explorationInfoHelper.getParameterValue(
            newState.info,
            ParameterType.Range,
          );
          if (currentRange == null) {
            const dateParam = explorationInfoHelper.getParameterValue<number>(
              newState.info,
              ParameterType.Date,
            );
            if (dateParam != null) {
              const date = DateTimeHelper.toDate(dateParam);
              explorationInfoHelper.setParameterValue(
                newState.info,
                [
                  DateTimeHelper.toNumberedDateFromDate(startOfWeek(date)),
                  DateTimeHelper.toNumberedDateFromDate(endOfWeek(date)),
                ],
                ParameterType.Range,
              );
            } else {
              const now = startOfDay(new Date());
              explorationInfoHelper.setParameterValue(
                newState.info,
                [
                  DateTimeHelper.toNumberedDateFromDate(subDays(now, 7)),
                  DateTimeHelper.toNumberedDateFromDate(endOfDay(now)),
                ],
                ParameterType.Range,
              );
            }
          }

          explorationInfoHelper.filterParameters(
            newState.info,
            param => param.parameter === ParameterType.Range,
          );

          newState.info.type = ExplorationType.B_Overview;
        }
        break;

      case ExplorationActionType.GoToComparisonCyclic:
        const comparisonCyclicAction = action as GoToComparisonCyclicAction;
        {
          const dataSource =
            comparisonCyclicAction.dataSource ||
            explorationInfoHelper.getParameterValue(
              newState.info,
              ParameterType.DataSource,
            );
          const range =
            comparisonCyclicAction.range ||
            explorationInfoHelper.getParameterValue(
              newState.info,
              ParameterType.Range,
            );
          const cycleType =
            comparisonCyclicAction.cycleType ||
            explorationInfoHelper.getParameterValue(
              newState.info,
              ParameterType.CycleType,
            );
          if (dataSource && range && cycleType) {
            newState.info.type = ExplorationType.C_Cyclic;
            newState.info.values = [];
            explorationInfoHelper.setParameterValue(
              newState.info,
              dataSource,
              ParameterType.DataSource,
            );
            explorationInfoHelper.setParameterValue(
              newState.info,
              range,
              ParameterType.Range,
            );
            explorationInfoHelper.setParameterValue(
              newState.info,
              cycleType,
              ParameterType.CycleType,
            );
          } else return state;
        }
        break;

      case ExplorationActionType.GoToComparisonToRanges:
        const comparisonRangesAction = action as GoToComparisonTwoRangesAction;
        {
          const dataSource =
            comparisonRangesAction.dataSource ||
            explorationInfoHelper.getParameterValue(
              newState.info,
              ParameterType.DataSource,
            );
          let rangeA =
            comparisonRangesAction.rangeA ||
            explorationInfoHelper.getParameterValue(
              newState.info,
              ParameterType.Range,
              ParameterKey.RangeA,
            );
          let rangeB =
            comparisonRangesAction.rangeB ||
            explorationInfoHelper.getParameterValue(
              newState.info,
              ParameterType.Range,
              ParameterKey.RangeB,
            );

          if (dataSource && rangeA && rangeB) {
            newState.info.type = ExplorationType.C_TwoRanges;
            newState.info.values = [];

            explorationInfoHelper.setParameterValue(
              newState.info,
              dataSource,
              ParameterType.DataSource,
            );
            explorationInfoHelper.setParameterValue(
              newState.info,
              rangeA,
              ParameterType.Range,
              ParameterKey.RangeA,
            );
            explorationInfoHelper.setParameterValue(
              newState.info,
              rangeB,
              ParameterType.Range,
              ParameterKey.RangeB,
            );
          } else return state;
        }
        break;


      case ExplorationActionType.GoToCyclicDetailRange:
      case ExplorationActionType.GoToCyclicDetailDaily:
        const goToCyclicDetailAction = action as GoToCyclicDetailAction;
        {
          const dataSource =
            goToCyclicDetailAction.dataSource ||
            explorationInfoHelper.getParameterValue(
              newState.info,
              ParameterType.DataSource,
            );
          const range =
            goToCyclicDetailAction.range ||
            explorationInfoHelper.getParameterValue(
              newState.info,
              ParameterType.Range,
            );
          const cycleDimension =
            goToCyclicDetailAction.cycleDimension ||
            explorationInfoHelper.getParameterValue(
              newState.info,
              ParameterType.CycleDimension,
            );
          if (dataSource && range && cycleDimension) {
            newState.info.type = action.type === ExplorationActionType.GoToCyclicDetailDaily ? ExplorationType.C_CyclicDetail_Daily : ExplorationType.C_CyclicDetail_Range
            newState.info.values = [];
            explorationInfoHelper.setParameterValue(
              newState.info,
              dataSource,
              ParameterType.DataSource,
            );
            explorationInfoHelper.setParameterValue(
              newState.info,
              range,
              ParameterType.Range,
            );
            explorationInfoHelper.setParameterValue(
              newState.info,
              cycleDimension,
              ParameterType.CycleDimension,
            );
          } else return state;
        }
        break;

      default:
        return state;
    }

    if(explorationInfoHelper.equals(newState.info, state.info)){
      newState.prevInfo = null
    }

    if (newState.info.type != state.info.type) {
      newState.backNavStack.push(shallowCopyExplorationInfo(state.info));
    }

    return newState;
  }
};
