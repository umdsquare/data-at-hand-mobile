import {FitbitService, makeFitbitHeartRateIntradayUrl} from './FitbitService';
import { IHeartRatePoint } from '../../../database/types';
import { sequenceDays } from '../../../utils';
import { FitbitIntradayHeartRateResult } from './types';
import { toDate } from 'date-fns-tz';
import { DataServiceMeasure } from '../DataService';

export class FitbitHeartRateMeasure extends DataServiceMeasure {
  fetchData(startDate: Date, endDate: Date): Promise<import("../../../database/types").IDatumBase[]> {
    throw new Error("Method not implemented.");
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
