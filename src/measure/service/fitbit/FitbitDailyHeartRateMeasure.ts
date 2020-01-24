import { FitbitDailyActivityHeartRateQueryResult } from './types';
import { FitbitSummaryLogMeasure } from './FitbitSummaryLogMeasure';
import { RestingHeartRateEntry } from './realm/schema';
import { makeFitbitDayLevelActivityLogsUrl } from './api';

export class FitbitDailyHeartRateMeasure extends FitbitSummaryLogMeasure<FitbitDailyActivityHeartRateQueryResult, RestingHeartRateEntry> {
    protected realmEntryClassType: any = RestingHeartRateEntry;
    protected resourcePropertyKey: string = "activities-heart"
    key: string = "resting_heart_rate"
    protected makeQueryUrl(startDate: number, endDate: number): string {
      return makeFitbitDayLevelActivityLogsUrl("activities/heart", startDate, endDate)
    }
    protected getQueryResultEntryValue(queryResultEntry: any) {
      return queryResultEntry.value.restingHeartRate
    }
}
