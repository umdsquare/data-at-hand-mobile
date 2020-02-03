import {FitbitService} from './FitbitService';
import {FitbitWeightQueryResult, FitbitWeightTrendQueryResult} from './types';
import {FitbitServiceMeasure} from './FitbitServiceMeasure';
import {FitbitSummaryLogMeasure} from './FitbitSummaryLogMeasure';
import {
  makeFitbitWeightTrendApiUrl,
  makeFitbitWeightLogApiUrl,
  FITBIT_DATE_FORMAT,
} from './api';
import {FitbitRangeMeasure} from './FitbitRangeMeasure';
import {DateTimeHelper} from '../../../time';
import {parse, getDay} from 'date-fns';
import {WeightRangedData, CyclicTimeFrame, GroupedData, IAggregatedValue} from '../../../core/exploration/data/types';
import {DataSourceType} from '../../DataSourceSpec';
import { FitbitLocalTableName } from './sqlite/database';

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

  async fetchData(
    startDate: number,
    endDate: number,
  ): Promise<WeightRangedData> {
    const trendData = await this.trendMeasure.fetchPreliminaryData(
      startDate,
      endDate,
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
      },
      pastNearestLog: latestLog,
      futureNearestLog: futureNearestLog,
      today: await this.fetchTodayValue(),
      statistics: [
        {type: 'avg', value: trendData.avg},
        {type: 'range', value: [trendData.min, trendData.max]},
        /*
        {label: STATISTICS_LABEL_AVERAGE + " ", valueText: trendData.avg.toFixed(1) + " kg"},
        {label: STATISTICS_LABEL_RANGE + " ", valueText: trendData.min.toFixed(1) + " - " + trendData.max.toFixed(1)}*/
      ],
    };
  }

  private async fetchTodayValue(): Promise<number> {
    const sorted = await this.service.fitbitLocalDbManager.fetchData(FitbitLocalTableName.WeightLog,
      "1 ORDER BY `numberedDate` DESC, `secondsOfDay` DESC LIMIT 1", [])
    return sorted.length > 0 ? (sorted[0] as any).value : null;
    /*
    if(sorted.length > 0){
      return {label: 'Recently', value: sorted[0].value, formatted: [{type: 'value', text: sorted[0].value.toFixed(1)}, {type: 'unit', text: ' kg'}]}
    }*/
  }


  async fetchCyclicGroupedData(start: number, end: number, cycleType: CyclicTimeFrame): Promise<GroupedData>{
    return this.trendMeasure.fetchCyclicGroupedData(start, end, cycleType)
  }

  async fetchRangeGroupedData(start: number, end: number): Promise<IAggregatedValue>{
    return this.trendMeasure.fetchRangeGroupedData(start, end)
  }
}

class FitbitWeightTrendMeasure extends FitbitSummaryLogMeasure<FitbitWeightTrendQueryResult> {
  key: string = 'weight_trend';

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
  key: string = 'weight_log';

  protected resourcePropertyKey: string = 'weight';
  protected maxQueryRangeLength: number = 32;

  protected makeQueryUrl(startDate: number, endDate: number): string {
    return makeFitbitWeightLogApiUrl(startDate, endDate);
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
      }else null
    }).filter(e => e != null)

    return this.service.fitbitLocalDbManager.insert(FitbitLocalTableName.WeightLog, entriesReady)
  }

  fetchData(startDate: number, endDate: number): Promise<any> {
    return this.service.fitbitLocalDbManager
      .fetchData(FitbitLocalTableName.WeightLog, "`numberedDate` BETWEEN ? AND ? ORDER BY `numberedDate` ASC, `secondsOfDay` ASC", [startDate, endDate]) 
  }

  async fetchLatestLog(before: number): Promise<any> {
    const filtered = await this.service.fitbitLocalDbManager.fetchData(FitbitLocalTableName.WeightLog,
      "`numberedDate` < ? ORDER BY `numberedDate` DESC, `secondsOfDay` DESC LIMIT 1", [before])
    
    if (filtered.length > 0) {
      return filtered[0];
    } else return null;
  }

  async fetchFutureNearestLog(after: number): Promise<any> {
    const filtered = await this.service.fitbitLocalDbManager.fetchData(FitbitLocalTableName.WeightLog,
      "`numberedDate` > ? ORDER BY `numberedDate` ASC, `secondsOfDay` ASC LIMIT 1", [after])

    if (filtered.length > 0) {
      return filtered[0];
    } else return null;
  }
}
