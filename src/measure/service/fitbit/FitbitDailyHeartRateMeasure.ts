import {FitbitService, makeFitbitDayLevelActivityLogsUrl} from './FitbitService';
import { DataServiceMeasure } from '../DataService';
import { FitbitDailyActivityHeartRateQueryResult } from './types';
import { toDate } from 'date-fns-tz';
import { DailySummaryDatum } from '../../../database/types';
import { DateTimeHelper } from '../../../time';
import { isSameDay, isAfter } from 'date-fns';

export class FitbitDailyHeartRateMeasure extends DataServiceMeasure {
  async fetchData(startDate: Date, endDate: Date): Promise<import("../../../database/types").IDatumBase[]> {
    
    const result: FitbitDailyActivityHeartRateQueryResult = await this.castedService<FitbitService>().fetchFitbitQuery(makeFitbitDayLevelActivityLogsUrl("activities/heart", startDate, endDate))
    const timeZone = await this.castedService<FitbitService>().getUserTimezone()
    
    const data = result["activities-heart"].map(entry => {

      const date = toDate(entry.dateTime, { timeZone })
      const now = new Date()
      return {
        value: entry.value.restingHeartRate,
        numberedDate: DateTimeHelper.fromFormattedString(entry.dateTime),
        subjectToChange: isSameDay(now, date) || isAfter(date, now)
      } as DailySummaryDatum
    })

    return data
  }
  /*
  async fetchData(start: number, end: number): Promise<Array<IHeartRatePoint>> {
    const result: Array<FitbitIntradayHeartRateResult> = await Promise.all(sequenceDays(start, end).map(day => this.castedService<FitbitService>().fetchFitbitQuery(makeFitbitHeartRateIntradayUrl(day))))
    const timeZone = await this.castedService<FitbitService>().getUserTimezone()

    const convertedResult: Array<IHeartRatePoint> = []

    result.forEach(dayRow => {
      const dateString = dayRow["activities-heart"][0].dateTime
      dayRow["activities-heart-intraday"].dataset.forEach(rawDatum => {
        convertedResult.push({
          measureCode: this.code,
          measuredAt: toDate(dateString + "T" + rawDatum.time, {timeZone: timeZone}),
          value: rawDatum.value,
          subjectToChange: false
        })
      })
    })

    return convertedResult
  }*/
}
