import { DataSourceType } from '@measure/DataSourceSpec';
export type StatisticsType = 'avg' | 'range' | 'total' | 'bedtime' | 'waketime';

export interface BoxPlotInfo {
  median: number,
  percentile25: number,
  percentile75: number,
  iqr: number,
  minWithoutOutlier: number,
  maxWithoutOutlier: number
}

export interface IAggregatedValue {
  timeKey: number;
  avg: number;
  min: number;
  max: number;
  n: number;
  sum: number;
}

export interface IAggregatedRangeValue {
  timeKey: number;

  avgA: number;
  minA: number;
  maxA: number;

  avgB: number;
  minB: number;
  maxB: number;

  n: number;
}

export interface IDailySummaryEntry {
  numberedDate: number;
  year: number;
  month: number;
  dayOfWeek: number;
}

export interface IIntraDayStepCountLog {
  hourOfDay: number;
  value: number;
}

export interface IIntraDayHeartRatePoint {
  secondOfDay: number;
  value: number;
}

export interface IDailyNumericSummaryEntry extends IDailySummaryEntry {
  value: number;
}

export enum SleepStage {
  Wake = 'wake',
  Light = 'light',
  Rem = 'rem',
  Deep = 'deep',
  Asleep = 'asleep',
  Restless = 'restless',
  Awake = 'awake',
}

export interface IDailySleepSummaryEntry extends IDailySummaryEntry {
  quality: number;
  stageType: 'stages' | 'simple';
  lengthInSeconds: number;
  bedTimeDiffSeconds: number;
  wakeTimeDiffSeconds: number;
  listOfLevels?: Array<{
    type: SleepStage;
    startBedtimeDiff: number;
    lengthInSeconds: number;
  }>;
}

export interface IIntraDayLogEntry extends IDailySummaryEntry {
  secondsOfDay: number;
}

export interface IWeightIntraDayLogEntry extends IIntraDayLogEntry {
  value: number;
  source: string;
}

export interface OverviewData {
  sourceDataList: Array<OverviewSourceRow>;
  highlightedDays: {[key:number]:boolean|undefined}
}

export interface DataSourceBrowseData extends OverviewSourceRow {
  highlightedDays: {[key:number]:boolean|undefined}
}

export interface OverviewSourceRow {
  source: DataSourceType;
  range: number[];
  data: any;
  today: any;
  preferredValueRange?: number[],
  statistics: Array<{ type: StatisticsType; value: any }>;
}

export interface StepCountRangedData extends OverviewSourceRow {
  data: Array<IDailySummaryEntry>;
}

export interface StepCountIntraDayData {
  numberedDate: number,
  hourlySteps: Array<IIntraDayStepCountLog>;
}

export interface RestingHeartRateRangedData extends OverviewSourceRow {
  data: Array<IDailySummaryEntry>;
}

export interface HeartRateZoneInfo {
  name: HeartRateZone;
  minutes: number;
  caloriesOut: number;
  max: number;
  min: number;
}

export enum HeartRateZone {
  Peak = 'peak',
  FatBurn = 'fat_burn',
  Cardio = 'cardio',
  OutOfRange = 'out',
}

export interface HeartRateIntraDayData {
  points: Array<IIntraDayHeartRatePoint>;
  restingHeartRate: number;
  zones: Array<HeartRateZoneInfo>;
  customZones: Array<HeartRateZoneInfo>;
}

export interface WeightRangedData extends OverviewSourceRow {
  data: {
    trend: Array<IDailySummaryEntry>;
    logs: Array<IWeightIntraDayLogEntry>;
  };
  pastNearestLog: IWeightIntraDayLogEntry;
  futureNearestLog: IWeightIntraDayLogEntry;
}

export interface SleepRangedData extends OverviewSourceRow {
  data: Array<IDailySleepSummaryEntry>;
}

interface IGroupedData<T>{
  data: Array<T>
  preferredValueRange?: number[],
}

export type GroupedData = IGroupedData<IAggregatedValue>

export type GroupedRangeData = IGroupedData<IAggregatedRangeValue>

export interface RangeAggregatedComparisonData<T> {
  data: Array<{ range: [number, number], value: T }>
  preferredValueRange?: number[],
}

export interface FilteredDailyValues {
  type: "point" | "length" | "range",
  data: Array<{ numberedDate: number, value: number, value2?: number }>
}

export const STATISTICS_LABEL_AVERAGE = 'Avg.';
export const STATISTICS_LABEL_TOTAL = 'Total';
export const STATISTICS_LABEL_RANGE = 'Range';
