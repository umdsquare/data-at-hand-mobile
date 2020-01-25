import {DataSourceType} from '../../../measure/DataSourceSpec';

export type StatisticsType = 'avg' | 'range' | 'total' | 'bedtime' | 'waketime';

export interface IDailySummaryEntry {
  numberedDate: number;
  year: number;
  month: number;
  dayOfWeek: number;
}

export interface IDailyNumericSummaryEntry extends IDailySummaryEntry {
  value: number;
}

export interface IDailySleepSummaryEntry extends IDailySummaryEntry {
    quality: number;
    lengthInSeconds: number;
    bedTimeDiffSeconds: number;
    wakeTimeDiffSeconds: number;
    levels?: Array<any>
}

export interface IIntraDayLogEntry extends IDailySummaryEntry {
  secondsOfDay: number;
}

export interface OverviewData {
  sourceDataList: Array<OverviewSourceRow>;
}

export interface OverviewSourceRow {
  source: DataSourceType;
  data: any;
  today: number;
  statistics: Array<{type: StatisticsType; value: any}>;
}

export interface StepCountRangedData extends OverviewSourceRow {
  data: Array<IDailySummaryEntry>;
}

export interface RestingHeartRateRangedData extends OverviewSourceRow {
  data: Array<IDailySummaryEntry>;
}

export interface WeightRangedData extends OverviewSourceRow {
  data: {
    trend: Array<IDailySummaryEntry>;
    logs: Array<IIntraDayLogEntry>;
  };
}

export interface SleepRangedData extends OverviewSourceRow {
    data: Array<IDailySleepSummaryEntry>
}

export const STATISTICS_LABEL_AVERAGE = 'Avg.';
export const STATISTICS_LABEL_TOTAL = 'Total';
export const STATISTICS_LABEL_RANGE = 'Range';