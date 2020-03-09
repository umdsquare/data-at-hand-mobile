import {startOfDay, subDays, endOfDay} from 'date-fns';
import {DateTimeHelper} from '../../time';
import { LayoutRectangle } from 'react-native';
import { DataSourceType } from '../../measure/DataSourceSpec';

export enum ExplorationType {
  B_Overview="b_overview",
  B_Range="b_range",
  B_Day="b_day",
  C_Cyclic="c_cyclic",
  C_CyclicDetail_Daily="c_cyclic_detail_daily",
  C_CyclicDetail_Range="c_cyclic_detail_range",
  C_TwoRanges="c_two_ranges",
}

export enum ExplorationMode {
  Browse = 'browse',
  Compare = 'compare',
}

export enum ParameterType {
  DataSource,
  IntraDayDataSource,
  Date,
  Range,
  CycleType,
  CycleDimension,
}

export enum ParameterKey {
    RangeA ='rangeA',
    RangeB = 'rangeB',
    Pivot = 'pivot'
}

export interface ExplorationInfoParameter {
  parameter: ParameterType;
  key?: ParameterKey;
  value: any;
}

export enum TouchingElementValueType{
  DayValue="day",
  RangeAggregated="rangeA",
  CycleDimension="cycleDimension"
}

export type ExplorationInfoParams = Array<ExplorationInfoParameter>

export interface TouchingElementInfo {
  touchId: string;
  elementBoundInScreen: LayoutRectangle;
  params: ExplorationInfoParams;
  value?: any
  valueType?: TouchingElementValueType
}

export interface ExplorationInfo {
  type: ExplorationType;
  values: ExplorationInfoParams;
}

export enum IntraDayDataSourceType {
    StepCount="step",
    HeartRate="heart_rate",
    Sleep="sleep"
}

export function shallowCopyExplorationInfo(original: ExplorationInfo): ExplorationInfo{
  return {
    ...original,
    values: original.values.map(v => ({...v}))
  }
}

export function getIntraDayDataSourceName(type: IntraDayDataSourceType): string{
    switch(type){
        case IntraDayDataSourceType.StepCount:
            return "Step Count"
        case IntraDayDataSourceType.Sleep:
            return "Main Sleep"
        case IntraDayDataSourceType.HeartRate:
            return "Heart Rate"
    }
}

export function inferIntraDayDataSourceType(dataSource: DataSourceType): IntraDayDataSourceType{
    switch(dataSource){
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

export function inferDataSource(intraDayDataSource: IntraDayDataSourceType): DataSourceType{
    switch(intraDayDataSource){
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
