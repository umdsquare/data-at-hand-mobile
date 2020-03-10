import { ActionTypeBase } from '../../types';
import { DataSourceType } from '../../../measure/DataSourceSpec';
import {
  TouchingElementInfo,
  IntraDayDataSourceType,
  ExplorationInfoParameter,
  HighlightFilter,
} from '../../../core/exploration/types';
import { CyclicTimeFrame, CycleDimension } from '../../../core/exploration/cyclic_time';

export enum ExplorationActionType {
  MemoUiStatus = 'exploration:interaction:memoUIStatus',
  SetRange = 'exploration:interaction:setRange',
  SetDataSource = 'exploration:interaction:setDataSource',
  SetIntraDayDataSource = 'exploration:interaction:setIntraDayDataSource',
  SetDate = 'exploration:interaction:setDate',
  SetCycleType = 'exploration:interaction:setCycleType',
  SetCycleDimension = 'exploration:interaction:setCycleDimension',

  SetHighlightFilter = 'exploration:interaction:setHighlightFilter',

  ShiftAllRanges = 'exploration:interaction:shiftAllRanges',

  GoToBrowseRange = 'exploration:interaction:goToBrowseRange',
  GoToBrowseOverview = 'exploration:interaction:goToBrowseOverview',
  GoToBrowseDay = 'exploration:interaction:goToBrowseDay',
  GoToComparisonCyclic = 'exploration:interaction:goToComparisonCyclic',
  GoToComparisonToRanges = 'exploration:interaction:goToComparisonTwoRanges',
  GoToCyclicDetailDaily = "exploration:interaction:goToCyclicDetailDaily",
  GoToCyclicDetailRange = "exploration:interaction:goToCyclicDetailRange",

  //History
  RestorePreviousInfo = 'exploration:interaction:restorePreviousInfo',
  GoBack = 'exploration:interaction:goBack',

  //Touch
  SetTouchElementInfo = 'exploration:interaction:setTouchElementInfo',
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
) {
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

export function setHighlightFilter(interactionType: InteractionType, highlightFilter?: HighlightFilter | null): SetHighlightFilterAction{
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

//===================================================
