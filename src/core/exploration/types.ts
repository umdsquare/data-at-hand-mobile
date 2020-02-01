import {startOfDay, subDays, endOfDay} from 'date-fns';
import {DateTimeHelper} from '../../time';
import { LayoutRectangle } from 'react-native';
import { DataSourceType } from '../../measure/DataSourceSpec';

export enum ExplorationType {
  B_Ovrvw,
  B_Range,
  B_Day,
  C_Cyclic,
  C_CyclicDetail,
  C_TwoRanges,
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
export type ParameterKey = 'range1' | 'range2' | 'pivot';

export interface ExplorationInfoParameter {
  parameter: ParameterType;
  key?: ParameterKey;
  value: any;
}

export interface TouchingElementInfo {
  touchId: string;
  elementBoundInScreen: LayoutRectangle;
  params: Array<ExplorationInfoParameter>;
}

export interface ExplorationInfo {
  type: ExplorationType;
  values: Array<ExplorationInfoParameter>;
}

export enum IntraDayDataSourceType {
    StepCount="step",
    HeartRate="heart_rate",
    Sleep="sleep"
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
    type: ExplorationType.B_Ovrvw,
    values: [
      {
        parameter: ParameterType.Range,
        value: [
          DateTimeHelper.toNumberedDateFromDate(subDays(now, 7)),
          DateTimeHelper.toNumberedDateFromDate(endOfDay(now)),
        ],
      },
    ],
  };
}
