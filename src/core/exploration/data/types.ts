import {DataSourceType} from '../../../measure/DataSourceSpec';

export interface IDailySummaryEntry {
  numberedDate: number;
  year: number;
  month: number;
  dayOfWeek: number;
}

export interface IIntraDayLogEntry extends IDailySummaryEntry {
  secondsOfDay: number;
}

export interface OverviewData {
  sourceDataList: Array<OverviewSourceRow>;
}

export interface TodayInfo {
  label: string;
  value: number;
  formatted: Array<{text: string; type: 'unit' | 'value'}>;
}

export interface OverviewSourceRow {
  source: DataSourceType;
  today: TodayInfo,
  data: any;
  statistics: Array<{label: string; valueText: string}>;
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

export const STATISTICS_LABEL_AVERAGE = "Avg."
export const STATISTICS_LABEL_TOTAL = "Total"
export const STATISTICS_LABEL_RANGE = "Range"