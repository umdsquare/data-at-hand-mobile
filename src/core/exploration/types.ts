import { startOfDay, subDays, endOfDay } from 'date-fns';
import { DateTimeHelper } from '@utils/time';
import { LayoutRectangle } from 'react-native';
import { DataSourceType } from '@data-at-hand/core/measure/DataSourceSpec';
import { ExplorationInfoParams, ExplorationInfo, ExplorationType, ParameterType } from '@data-at-hand/core/exploration/ExplorationInfo';


export enum TouchingElementValueType {
  DayValue = "day",
  RangeAggregated = "rangeA",
  CycleDimension = "cycleDimension"
}

export interface TouchingElementInfo {
  touchId: string;
  elementBoundInScreen: LayoutRectangle;
  params: ExplorationInfoParams;
  value?: any
  valueType?: TouchingElementValueType
}

export enum IntraDayDataSourceType {
  StepCount = "step",
  HeartRate = "heart_rate",
  Sleep = "sleep"
}

export function shallowCopyExplorationInfo(original: ExplorationInfo): ExplorationInfo {
  return {
    ...original,
    values: original.values.map(v => ({ ...v })),
    highlightFilter: original.highlightFilter
  }
}

export function getIntraDayDataSourceName(type: IntraDayDataSourceType): string {
  switch (type) {
    case IntraDayDataSourceType.StepCount:
      return "Step Count"
    case IntraDayDataSourceType.Sleep:
      return "Sleep"
    case IntraDayDataSourceType.HeartRate:
      return "Heart Rate"
  }
}

export function inferIntraDayDataSourceType(dataSource: DataSourceType): IntraDayDataSourceType {
  switch (dataSource) {
    case DataSourceType.StepCount:
      return IntraDayDataSourceType.StepCount
    case DataSourceType.HeartRate:
      return IntraDayDataSourceType.HeartRate
    case DataSourceType.HoursSlept:
    case DataSourceType.SleepRange:
      return IntraDayDataSourceType.Sleep
    default: return null
  }
}

export function inferDataSource(intraDayDataSource: IntraDayDataSourceType): DataSourceType {
  switch (intraDayDataSource) {
    case IntraDayDataSourceType.StepCount:
      return DataSourceType.StepCount
    case IntraDayDataSourceType.Sleep:
      return DataSourceType.SleepRange
    case IntraDayDataSourceType.HeartRate:
      return DataSourceType.HeartRate
  }
}

export function makeInitialStateInfo(): ExplorationInfo {
  const now = startOfDay(new Date());
  return {
    type: ExplorationType.B_Overview,
    values: [
      {
        parameter: ParameterType.Range,
        value: [
          DateTimeHelper.toNumberedDateFromDate(subDays(now, 6)),
          DateTimeHelper.toNumberedDateFromDate(endOfDay(now)),
        ],
      },
    ],
  };
}
