import { ActionTypeBase } from '@state/types';
import { DataSourceType, IntraDayDataSourceType } from '@data-at-hand/core/measure/DataSourceSpec';
import { TouchingElementInfo } from '@data-at-hand/core/exploration/TouchingElementInfo';
import { CyclicTimeFrame, CycleDimension } from '@data-at-hand/core/exploration/CyclicTimeFrame';
import { startOfDay, subDays, endOfDay } from 'date-fns';
import { DateTimeHelper } from '@data-at-hand/core/utils/time';
import { HighlightFilter } from '@data-at-hand/core/exploration/ExplorationInfo';
import { InteractionType, SetRangeAction, SetDateAction, SetIntraDayDataSourceAction, GoToBrowseRangeAction, GoToBrowseDayAction, GoToComparisonCyclicAction, GoToComparisonTwoRangesAction, GoToCyclicDetailAction, MemoUIStatusAction, SetDataSourceAction, SetTouchingElementInfoAction, SetCycleDimensionAction, ShiftAllRangesAction, SetHighlightFilterAction, ExplorationActionType, SetCycleTypeAction, ResetAction } from '@data-at-hand/core/exploration/actions';

export type ExplorationAction =
  | ActionTypeBase
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
  interactionContext: string,
  range: [number, number],
  key?: string,
): SetRangeAction {
  return {
    type: ExplorationActionType.SetRange,
    interactionType,
    interactionContext,
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
): ActionTypeBase {
  return {
    type: ExplorationActionType.GoToBrowseOverview,
    interactionType,
  } as any;
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
    type: ExplorationActionType.GoToComparisonTwoRanges,
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
  interactionContext: string | undefined,
  dataSource: DataSourceType,
): SetDataSourceAction {
  return {
    type: ExplorationActionType.SetDataSource,
    interactionType,
    interactionContext,
    dataSource,
  };
}

export function setIntraDayDataSourceAction(
  interactionType: InteractionType,
  interactionContext: string | undefined,
  intraDayDataSource: IntraDayDataSourceType,
): SetIntraDayDataSourceAction {
  return {
    type: ExplorationActionType.SetIntraDayDataSource,
    interactionType,
    interactionContext,
    intraDayDataSource,
  };
}

export function setCycleTypeAction(
  interactionType: InteractionType,
  interactionContext: string | undefined,
  cycleType: CyclicTimeFrame,
): SetCycleTypeAction {
  return {
    type: ExplorationActionType.SetCycleType,
    interactionType,
    interactionContext,
    cycleType,
  };
}

export function setDateAction(
  interactionType: InteractionType,
  interactionContext: string | undefined,
  date: number,
): SetDateAction {
  return {
    type: ExplorationActionType.SetDate,
    interactionType,
    interactionContext,
    date,
  };
}

export function setCycleDimensionAction(interactionType: InteractionType, interactionContext: string | undefined, cycleDimension: CycleDimension): SetCycleDimensionAction {
  return {
    type: ExplorationActionType.SetCycleDimension,
    interactionType,
    interactionContext,
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
  return {
    type: ExplorationActionType.Reset,
    resetRange: [
      DateTimeHelper.toNumberedDateFromDate(subDays(now, 6)),
      DateTimeHelper.toNumberedDateFromDate(endOfDay(now)),
    ]
  }
}

//===================================================
