import {FitbitDailyActivityHeartRateQueryResult} from './types';
import {FitbitSummaryLogMeasure} from './FitbitSummaryLogMeasure';
import {RestingHeartRateEntry} from './realm/schema';
import {makeFitbitDayLevelActivityLogsUrl} from './api';
import { RestingHeartRateRangedData, STATISTICS_LABEL_RANGE } from '../../../core/exploration/data/types';
import { DataSourceType } from '../../DataSourceSpec';

export class FitbitDailyHeartRateMeasure extends FitbitSummaryLogMeasure<
  FitbitDailyActivityHeartRateQueryResult,
  RestingHeartRateEntry
> {
  protected realmEntryClassType: any = RestingHeartRateEntry;
  protected resourcePropertyKey: string = 'activities-heart';
  key: string = 'resting_heart_rate';
  protected makeQueryUrl(startDate: number, endDate: number): string {
    return makeFitbitDayLevelActivityLogsUrl(
      'activities/heart',
      startDate,
      endDate,
    );
  }
  protected getQueryResultEntryValue(queryResultEntry: any) {
    return queryResultEntry.value.restingHeartRate;
  }

  async fetchData(startDate: number, endDate: number): Promise<any> {
    const rangedData = await super.fetchPreliminaryData(startDate, endDate);
    const base = {
      source: DataSourceType.HeartRate,
      data: rangedData.list,
      today: this.fetchTodayValue(),
      statistics:
        [/*
          {
            label: STATISTICS_LABEL_AVERAGE + " ",
            valueText: Math.round(
              rangedData.avg,
            ).toString() + " bpm",
          },
          {
              label: STATISTICS_LABEL_RANGE + " ",
              valueText: rangedData.min + " - " + rangedData.max
          }*/
          {
            type: 'avg',
            value: rangedData.avg
          },
          {
            type: 'range',
            value: [rangedData.min, rangedData.max]
          }
        ]
    } as RestingHeartRateRangedData;

    return base;
  }
}
