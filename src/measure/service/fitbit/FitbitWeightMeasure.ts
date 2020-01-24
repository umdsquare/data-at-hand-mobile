import {FitbitService} from './FitbitService';
import {FitbitWeightQueryResult, FitbitWeightTrendQueryResult} from './types';
import {FitbitServiceMeasure} from './FitbitServiceMeasure';
import {FitbitSummaryLogMeasure} from './FitbitSummaryLogMeasure';
import {DailyWeightTrendEntry, WeightIntraDayLogEntry} from './realm/schema';
import {
  makeFitbitWeightTrendApiUrl,
  makeFitbitWeightLogApiUrl,
  FITBIT_DATE_FORMAT,
} from './api';
import {FitbitRangeMeasure} from './FitbitRangeMeasure';
import {DateTimeHelper} from '../../../time';
import {parse, getDay} from 'date-fns';
import { TodayInfo, WeightRangedData, STATISTICS_LABEL_RANGE, STATISTICS_LABEL_AVERAGE } from '../../../core/exploration/data/types';
import { DataSourceType } from '../../DataSourceSpec';

export class FitbitWeightMeasure extends FitbitServiceMeasure {
  
  key: string = 'weight';

  private trendMeasure: FitbitWeightTrendMeasure;
  private logMeasure: FitbitWeightLogMeasure;

  constructor(service: FitbitService) {
    super(service);
    this.trendMeasure = new FitbitWeightTrendMeasure(service);
    this.logMeasure = new FitbitWeightLogMeasure(service);
  }

  async cacheServerData(
    endDate: number,
  ): Promise<{success: boolean; skipped?: boolean}> {
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

  async fetchData(startDate: Date, endDate: Date): Promise<WeightRangedData> {
    const trendData = await this.trendMeasure.fetchPreliminaryData(startDate, endDate)
    const logData = await this.logMeasure.fetchData(startDate, endDate)
    return {
      source: DataSourceType.Weight,
      data: {
        trend: trendData.list,
        logs: logData
      },
      today: this.fetchTodayInfo(),
      statistics: [
        {label: STATISTICS_LABEL_AVERAGE + " ", valueText: trendData.avg.toFixed(1) + " kg"},
        {label: STATISTICS_LABEL_RANGE + " ", valueText: trendData.min.toFixed(1) + " - " + trendData.max.toFixed(1)}
      ]
    }
  }

  fetchTodayInfo(): TodayInfo {
    const sorted = this.service.realm.objects<WeightIntraDayLogEntry>(WeightIntraDayLogEntry).sorted([["numberedDate", true], ["secondsOfDay", true]])
    if(sorted.length > 0){
      return {label: 'Recently', value: sorted[0].value, formatted: [{type: 'value', text: sorted[0].value.toFixed(1)}, {type: 'unit', text: ' kg'}]}
    }
  }
}

class FitbitWeightTrendMeasure extends FitbitSummaryLogMeasure<
  FitbitWeightTrendQueryResult,
  DailyWeightTrendEntry
> {

  key: string = 'weight_trend';

  protected realmEntryClassType: any = DailyWeightTrendEntry;
  protected resourcePropertyKey: string = 'body-weight';

  protected makeQueryUrl(startDate: number, endDate: number): string {
    return makeFitbitWeightTrendApiUrl(startDate, endDate);
  }

  protected getQueryResultEntryValue(queryResultEntry: any) {
    return Number.parseFloat(queryResultEntry.value);
  }

  fetchTodayInfo(): TodayInfo {
    return null //noop
  }
  
  formatTodayValue(value: number): { text: string; type: "unit" | "value"; }[] {
    return null //noop
  }
  fetchData(startDate: Date, endDate: Date): Promise<any> {
    return null //noop
  }
  
}

class FitbitWeightLogMeasure extends FitbitRangeMeasure<
  FitbitWeightQueryResult
> {

  key: string = 'weight_log';

  protected resourcePropertyKey: string = 'weight';
  protected maxQueryRangeLength: number = 32;

  protected makeQueryUrl(startDate: number, endDate: number): string {
    return makeFitbitWeightLogApiUrl(startDate, endDate);
  }

  protected handleQueryResultEntry(realm: Realm, entry: any, now: Date) {
    if (entry.weight != null) {
      const numberedDate = DateTimeHelper.fromFormattedString(entry.date);
      const date = parse(entry.date, FITBIT_DATE_FORMAT, now);

      const timeSplit = entry.time.split(':')
      const hour = Number.parseInt(timeSplit[0])
      const minute = Number.parseInt(timeSplit[1])
      const second = Number.parseInt(timeSplit[2])

      realm.create(
        WeightIntraDayLogEntry,
        {
          id: entry.date + "T" + entry.time,
          value: entry.weight,
          source: entry.source,
          numberedDate,
          secondsOfDay: hour * 3600 + minute * 60 + second,
          year: DateTimeHelper.getYear(numberedDate),
          month: DateTimeHelper.getMonth(numberedDate),
          dayOfWeek: getDay(date),
        },
        true,
      );
    }
  }

  fetchData(startDate: Date, endDate: Date): Promise<any> {
    const filtered = this.service.realm
      .objects<WeightIntraDayLogEntry>(WeightIntraDayLogEntry)
      .filtered(
        'numberedDate >= ' +
          DateTimeHelper.toNumberedDateFromDate(startDate) +
          ' AND numberedDate <= ' +
          DateTimeHelper.toNumberedDateFromDate(endDate),
      );
    return filtered.snapshot().map(v => v.toJson()) as any;
  }

  fetchTodayInfo(): TodayInfo {
    throw new Error("Method not implemented.");
  }
}
