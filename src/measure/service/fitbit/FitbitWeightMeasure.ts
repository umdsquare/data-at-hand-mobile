import { FitbitWeightQueryResult, FitbitWeightTrendQueryResult, FitbitServiceCore } from './types';
import { FitbitServiceMeasure } from './FitbitServiceMeasure';
import { FitbitSummaryLogMeasure } from './FitbitSummaryLogMeasure';
import {
  makeFitbitWeightTrendApiUrl,
  makeFitbitWeightLogApiUrl,
  FITBIT_DATE_FORMAT,
} from './api';
import { FitbitRangeMeasure } from './FitbitRangeMeasure';
import { DateTimeHelper } from '@data-at-hand/core/utils/time';
import { parse, getDay } from 'date-fns';
import { WeightRangedData, GroupedData, IAggregatedValue, FilteredDailyValues, BoxPlotInfo } from '@core/exploration/data/types';
import { DataSourceType } from '@data-at-hand/core/measure/DataSourceSpec';
import { FitbitLocalTableName } from './sqlite/database';
import { CyclicTimeFrame, CycleDimension } from '@data-at-hand/core/exploration/CyclicTimeFrame';

export class FitbitWeightMeasure extends FitbitServiceMeasure {
  key: string = 'weight';
  displayName = "Weight"

  private trendMeasure: FitbitWeightTrendMeasure;
  private logMeasure: FitbitWeightLogMeasure;

  constructor(core: FitbitServiceCore) {
    super(core);
    this.trendMeasure = new FitbitWeightTrendMeasure(core);
    this.logMeasure = new FitbitWeightLogMeasure(core);
  }


  protected async getBoxPlotInfoOfDatasetFromDb(): Promise<BoxPlotInfo> {
    return this.core.fitbitLocalDbManager.getBoxplotInfo(FitbitLocalTableName.WeightTrend)
  }

  async cacheServerData(
    endDate: number,
  ): Promise<{ success: boolean; skipped?: boolean }> {
    const trendResult = await this.trendMeasure.cacheServerData(endDate);
    const logResult = await this.logMeasure.cacheServerData(endDate);

    return {
      success: trendResult.success === true && logResult.success === true,
      skipped: trendResult.skipped === true || logResult.skipped === true,
    };
  }

  protected async fetchAndCacheFitbitData(
    startDate: number,
    endDate: number,
  ): Promise<void> {
    return; // noop
  }

  async fetchData(
    startDate: number,
    endDate: number,
    includeStatistics: boolean,
    includeToday: boolean
  ): Promise<WeightRangedData> {
    const trendData = await this.trendMeasure.fetchPreliminaryData(
      startDate,
      endDate,
      includeStatistics
    );
    const logData = await this.logMeasure.fetchData(startDate, endDate);
    const latestLog = await this.logMeasure.fetchLatestLog(startDate);
    const futureNearestLog = await this.logMeasure.fetchFutureNearestLog(endDate);

    return {
      source: DataSourceType.Weight,
      range: [startDate, endDate],
      data: {
        trend: trendData.list,
        logs: logData,
        pastNearestLog: latestLog,
        futureNearestLog: futureNearestLog,
      },
      today: includeToday === true ? await this.fetchTodayValue() : null,
      statistics: [
        { type: 'avg', value: trendData.avg },
        { type: 'range', value: [trendData.min, trendData.max] },
        /*
        {label: STATISTICS_LABEL_AVERAGE + " ", valueText: trendData.avg.toFixed(1) + " kg"},
        {label: STATISTICS_LABEL_RANGE + " ", valueText: trendData.min.toFixed(1) + " - " + trendData.max.toFixed(1)}*/
      ],
    };
  }

  private async fetchTodayValue(): Promise<number> {
    const sorted = await this.core.fitbitLocalDbManager.fetchData(FitbitLocalTableName.WeightLog,
      "1 ORDER BY `numberedDate` DESC, `secondsOfDay` DESC LIMIT 1", [])
    return sorted.length > 0 ? (sorted[0] as any).value : null;
    /*
    if(sorted.length > 0){
      return {label: 'Recently', value: sorted[0].value, formatted: [{type: 'value', text: sorted[0].value.toFixed(1)}, {type: 'unit', text: ' kg'}]}
    }*/
  }


  async fetchCyclicGroupedData(start: number, end: number, cycleType: CyclicTimeFrame): Promise<GroupedData> {
    return this.trendMeasure.fetchCyclicGroupedData(start, end, cycleType)
  }

  async fetchRangeGroupedData(start: number, end: number): Promise<IAggregatedValue> {
    return this.trendMeasure.fetchRangeGroupedData(start, end)
  }

  async fetchCycleRangeDimensionData(start: number, end: number, cycleDimension: CycleDimension): Promise<IAggregatedValue[]> {
    return this.trendMeasure.fetchCycleRangeDimensionData(start, end, cycleDimension)
  }

  async fetchCycleDailyDimensionData(start: number, end: number, cycleDimension: CycleDimension): Promise<FilteredDailyValues> {
    const data = await this.trendMeasure.fetchCycleDailyDimensionData(start, end, cycleDimension)
    data.type = 'point'
    return data
  }
}

class FitbitWeightTrendMeasure extends FitbitSummaryLogMeasure<FitbitWeightTrendQueryResult> {

  key: string = 'weight_trend';
  displayName = "Weight Trend"

  protected queryFunc(startDate: number, endDate: number, prefetchMode: boolean): Promise<FitbitWeightTrendQueryResult> {
    return this.core.fetchWeightTrend(startDate, endDate, prefetchMode)
  }

  protected dbTableName = FitbitLocalTableName.WeightTrend
  protected resourcePropertyKey: string = 'body-weight';

  protected makeQueryUrl(startDate: number, endDate: number): string {
    return makeFitbitWeightTrendApiUrl(startDate, endDate);
  }

  protected getQueryResultEntryValue(queryResultEntry: any) {
    return Number.parseFloat(queryResultEntry.value);
  }

  fetchData(startDate: Date, endDate: Date): Promise<any> {
    return null; //noop
  }
}

class FitbitWeightLogMeasure extends FitbitRangeMeasure<
  FitbitWeightQueryResult
  > {


  protected getBoxPlotInfoOfDatasetFromDb(): Promise<BoxPlotInfo> {
    return null
  }

  key: string = 'weight_log';
  displayName = "Weight Log"

  protected resourcePropertyKey: string = 'weight';
  protected maxQueryRangeLength: number = 32;


  protected queryFunc(startDate: number, endDate: number, prefetchMode: boolean): Promise<FitbitWeightQueryResult> {
    return this.core.fetchWeightLogs(startDate, endDate, prefetchMode)
  }

  protected handleQueryResultEntry(entries: Array<any>, now: Date): Promise<void> {
    const entriesReady = entries.map(entry => {
      if (entry.weight != null) {
        const numberedDate = DateTimeHelper.fromFormattedString(entry.date);
        const date = parse(entry.date, FITBIT_DATE_FORMAT, now);

        const timeSplit = entry.time.split(':');
        const hour = Number.parseInt(timeSplit[0]);
        const minute = Number.parseInt(timeSplit[1]);
        const second = Number.parseInt(timeSplit[2]);

        return {
          id: entry.date + 'T' + entry.time,
          value: entry.weight,
          source: entry.source,
          numberedDate,
          secondsOfDay: hour * 3600 + minute * 60 + second,
          year: DateTimeHelper.getYear(numberedDate),
          month: DateTimeHelper.getMonth(numberedDate),
          dayOfWeek: getDay(date),
        }
      } else null
    }).filter(e => e != null)

    return this.core.fitbitLocalDbManager.insert(FitbitLocalTableName.WeightLog, entriesReady)
  }

  fetchData(startDate: number, endDate: number): Promise<any> {
    return this.core.fitbitLocalDbManager
      .fetchData(FitbitLocalTableName.WeightLog, "`numberedDate` BETWEEN ? AND ? ORDER BY `numberedDate` ASC, `secondsOfDay` ASC", [startDate, endDate])
  }

  async fetchLatestLog(before: number): Promise<any> {
    const filtered = await this.core.fitbitLocalDbManager.fetchData(FitbitLocalTableName.WeightLog,
      "`numberedDate` < ? ORDER BY `numberedDate` DESC, `secondsOfDay` DESC LIMIT 1", [before])

    if (filtered.length > 0) {
      return filtered[0];
    } else return null;
  }

  async fetchFutureNearestLog(after: number): Promise<any> {
    const filtered = await this.core.fitbitLocalDbManager.fetchData(FitbitLocalTableName.WeightLog,
      "`numberedDate` > ? ORDER BY `numberedDate` ASC, `secondsOfDay` ASC LIMIT 1", [after])

    if (filtered.length > 0) {
      return filtered[0];
    } else return null;
  }
}
