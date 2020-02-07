import {FitbitDailyActivityHeartRateQueryResult} from './types';
import {FitbitSummaryLogMeasure} from './FitbitSummaryLogMeasure';
import {makeFitbitDayLevelActivityLogsUrl} from './api';
import { RestingHeartRateRangedData, STATISTICS_LABEL_RANGE, FilteredDailyValues } from '../../../core/exploration/data/types';
import { DataSourceType } from '../../DataSourceSpec';
import { FitbitLocalTableName } from './sqlite/database';
import { CycleDimension } from '../../../core/exploration/cyclic_time';

export class FitbitDailyHeartRateMeasure extends FitbitSummaryLogMeasure<FitbitDailyActivityHeartRateQueryResult> {
  
  protected dbTableName = FitbitLocalTableName.RestingHeartRate;

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
      range: [startDate, endDate],
      today: await this.fetchTodayValue(),
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

  async fetchCycleDailyDimensionData(start: number, end: number, cycleDimension: CycleDimension): Promise<FilteredDailyValues> {
    const data = await super.fetchCycleDailyDimensionData(start, end, cycleDimension)
    data.type = 'point'
    return data
  }
}
