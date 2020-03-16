import { ActionTypeBase } from '@state/types';
import { DataSourceType } from '@measure/DataSourceSpec';
import {
  TouchingElementInfo,
  IntraDayDataSourceType,
  HighlightFilter,
} from '@core/exploration/types';
import { CyclicTimeFrame, CycleDimension } from '@core/exploration/cyclic_time';
import { startOfDay, subDays, endOfDay } from 'date-fns';
import { DateTimeHelper } from '@utils/time';

export const USER_INTERACTION_ACTION_PREFIX = "exploration:interaction:user"

export enum ExplorationActionType {
  MemoUiStatus = 'exploration:interaction:system:memoUIStatus',

  SetRange = 'exploration:interaction:user:setRange',
  SetDataSource = 'exploration:interaction:user:setDataSource',
  SetIntraDayDataSource = 'exploration:interaction:user:setIntraDayDataSource',
  SetDate = 'exploration:interaction:user:setDate',
  SetCycleType = 'exploration:interaction:user:etCycleType',
  SetCycleDimension = 'exploration:interaction:user:setCycleDimension',

  SetHighlightFilter = 'exploration:interaction:user:setHighlightFilter',

  ShiftAllRanges = 'exploration:interaction:user:shiftAllRanges',

  GoToBrowseRange = 'exploration:interaction:user:goToBrowseRange',
  GoToBrowseOverview = 'exploration:interaction:user:goToBrowseOverview',
  GoToBrowseDay = 'exploration:interaction:user:goToBrowseDay',
  GoToComparisonCyclic = 'exploration:interaction:user:goToComparisonCyclic',
  GoToComparisonToRanges = 'exploration:interaction:user:goToComparisonTwoRanges',
  GoToCyclicDetailDaily = "exploration:interaction:user:goToCyclicDetailDaily",
  GoToCyclicDetailRange = "exploration:interaction:user:goToCyclicDetailRange",

  //History
  RestorePreviousInfo = 'exploration:interaction:user:restorePreviousInfo',
  GoBack = 'exploration:interaction:user:goBack',
  Reset = 'exploration:interaction:system:reset',

  //Touch
  SetTouchElementInfo = 'exploration:interaction:user:setTouchElementInfo',
}

export enum InteractionType {
  TouchOnly = 'touchonly',
  Speech = 'speech',
}

interface ExplorationActionBase extends ActionTypeBase {
  interactionType: InteractionType;
}

export interface MemoUIStatusAction extends ActionTypeBase {
  key: string;
  value: any;
}

export interface ResetAction extends ActionTypeBase {
  resetRange: [number, number]
}

export interface SetRangeAction extends ExplorationActionBase {
  range: [number, number];
  key?: string;
}

export interface SetDateAction extends ExplorationActionBase {
  date: number;
}

export interface SetDataSourceAction extends ExplorationActionBase {
  dataSource: DataSourceType;
}

export interface SetIntraDayDataSourceAction extends ExplorationActionBase {
  intraDayDataSource: IntraDayDataSourceType;
}

export interface SetCycleTypeAction extends ExplorationActionBase {
  cycleType: CyclicTimeFrame;
}

export interface SetHighlightFilterAction extends ExplorationActionBase {
  highlightFilter: HighlightFilter | null
}

export interface GoToBrowseRangeAction extends ExplorationActionBase {
  dataSource?: DataSourceType;
  range?: [number, number];
}

export interface GoToBrowseDayAction extends ExplorationActionBase {
  intraDayDataSource?: IntraDayDataSourceType;
  date?: number;
}

export interface GoToComparisonCyclicAction extends ExplorationActionBase {
  dataSource?: DataSourceType;
  range?: [number, number];
  cycleType?: CyclicTimeFrame;
}

export interface GoToComparisonTwoRangesAction extends ExplorationActionBase {
  dataSource?: DataSourceType;
  rangeA?: [number, number];
  rangeB?: [number, number];
}

export interface GoToCyclicDetailAction extends ExplorationActionBase {
  dataSource?: DataSourceType;
  range?: [number, number];
  cycleDimension?: CycleDimension;
}

export interface SetCycleDimensionAction extends ExplorationActionBase {
  cycleDimension: CycleDimension;
}

export interface SetTouchingElementInfoAction extends ActionTypeBase {
  info: TouchingElementInfo | null;
}

export interface ShiftAllRangesAction extends ExplorationActionBase {
  direction: 'past' | 'future'
}


export type ExplorationAction =
  | ActionTypeBase
  | ExplorationActionBase
  | SetRangeAction
  | SetDateAction
  | SetIntraDayDataSourceAction
  | GoToBrowseRangeAction
  | GoToBrowseDayAction
  | GoToComparisonCyclicAction
  | GoToComparisonTwoRangesAction
  | GoToCyclicDetailAction
  | MemoUIStatusAction
  | SetDataSourceAction
  | SetTouchingElementInfoAction
  | SetCycleDimensionAction
  | ShiftAllRangesAction
  | SetHighlightFilterAction

export function createSetRangeAction(
  interactionType: InteractionType,
  range: [number, number],
  key?: string,
): SetRangeAction {
  return {
    type: ExplorationActionType.SetRange,
    interactionType,
    range,
    key,
  };
}

export function createGoToBrowseRangeAction(
  interactionType: InteractionType,
  dataSource?: DataSourceType,
  range?: [number, number],
): GoToBrowseRangeAction {
  return {
    type: ExplorationActionType.GoToBrowseRange,
    interactionType,
    range,
    dataSource,
  };
}

export function createGoToBrowseOverviewAction(
  interactionType: InteractionType,
): ExplorationActionBase {
  return {
    type: ExplorationActionType.GoToBrowseOverview,
    interactionType,
  };
}

export function createGoToBrowseDayAction(
  interactionType: InteractionType,
  intraDayDataSource?: IntraDayDataSourceType,
  date?: number,
): GoToBrowseDayAction {
  return {
    type: ExplorationActionType.GoToBrowseDay,
    interactionType,
    intraDayDataSource,
    date,
  };
}

export function createGoToComparisonCyclicAction(
  interactionType: InteractionType,
  dataSource?: DataSourceType,
  range?: [number, number],
  cycleType?: CyclicTimeFrame,
): GoToComparisonCyclicAction {
  return {
    type: ExplorationActionType.GoToComparisonCyclic,
    interactionType,
    dataSource,
    range,
    cycleType,
  };
}

export function createGoToComparisonTwoRangesAction(
  interactionType: InteractionType,
  dataSource?: DataSourceType,
  rangeA?: [number, number],
  rangeB?: [number, number],
): GoToComparisonTwoRangesAction {
  return {
    type: ExplorationActionType.GoToComparisonToRanges,
    interactionType,
    dataSource,
    rangeA,
    rangeB
  }
}

export function createRestorePreviousInfoAction(): ActionTypeBase {
  return {
    type: ExplorationActionType.RestorePreviousInfo,
  };
}

export function createGoToCyclicDetailDailyAction(
  interactionType: InteractionType,
  dataSource?: DataSourceType,
  range?: [number, number],
  cycleDimension?: CycleDimension): GoToCyclicDetailAction {
  return {
    type: ExplorationActionType.GoToCyclicDetailDaily,
    interactionType,
    dataSource,
    range,
    cycleDimension
  }
}

export function createGoToCyclicDetailRangeAction(
  interactionType: InteractionType,
  dataSource?: DataSourceType,
  range?: [number, number],
  cycleDimension?: CycleDimension): GoToCyclicDetailAction {
  return {
    type: ExplorationActionType.GoToCyclicDetailRange,
    interactionType,
    dataSource,
    range,
    cycleDimension
  }
}

export function memoUIStatus(key: string, value: any): MemoUIStatusAction {
  return {
    type: ExplorationActionType.MemoUiStatus,
    key,
    value,
  };
}

export function setDataSourceAction(
  interactionType: InteractionType,
  dataSource: DataSourceType,
): SetDataSourceAction {
  return {
    type: ExplorationActionType.SetDataSource,
    interactionType,
    dataSource,
  };
}

export function setIntraDayDataSourceAction(
  interactionType: InteractionType,
  intraDayDataSource: IntraDayDataSourceType,
): SetIntraDayDataSourceAction {
  return {
    type: ExplorationActionType.SetIntraDayDataSource,
    interactionType,
    intraDayDataSource,
  };
}

export function setCycleTypeAction(
  interactionType: InteractionType,
  cycleType: CyclicTimeFrame,
): SetCycleTypeAction {
  return {
    type: ExplorationActionType.SetCycleType,
    interactionType,
    cycleType,
  };
}

export function setDateAction(
  interactionType: InteractionType,
  date: number,
): SetDateAction {
  return {
    type: ExplorationActionType.SetDate,
    interactionType,
    date,
  };
}

export function setCycleDimensionAction(interactionType: InteractionType, cycleDimension: CycleDimension): SetCycleDimensionAction {
  return {
    type: ExplorationActionType.SetCycleDimension,
    interactionType,
    cycleDimension
  }
}

export function setTouchElementInfo(
  info: TouchingElementInfo | null,
): SetTouchingElementInfoAction {
  return {
    type: ExplorationActionType.SetTouchElementInfo,
    info,
  };
}

export function shiftAllRanges(interactionType: InteractionType, direction: 'past' | 'future'): ShiftAllRangesAction {
  return {
    interactionType,
    type: ExplorationActionType.ShiftAllRanges,
    direction
  }
}

export function setHighlightFilter(interactionType: InteractionType, highlightFilter?: HighlightFilter | null): SetHighlightFilterAction {
  return {
    interactionType,
    type: ExplorationActionType.SetHighlightFilter,
    highlightFilter: highlightFilter
  }
}

export function goBackAction(): ActionTypeBase {
  return {
    type: ExplorationActionType.GoBack,
  };
}

export function resetAction(today: Date): ResetAction {
  const now = startOfDay(today);
  console.log("now:", now)
  return {
    type: ExplorationActionType.Reset,
    resetRange: [
      DateTimeHelper.toNumberedDateFromDate(subDays(now, 6)),
      DateTimeHelper.toNumberedDateFromDate(endOfDay(now)),
    ]
  }
}

//===================================================
