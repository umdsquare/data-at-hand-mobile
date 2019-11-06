import {measureService, MeasureSpecKey} from '../../../system/MeasureService';
import {MeasureSpec} from '../../MeasureSpec';
import {FitbitSource, makeFitbitHeartRateIntradayUrl} from './FitbitSource';
import {FitbitMeasureBase} from './FitbitMeasureBase';
import { IHeartRatePoint } from '../../../database/types';
import { sequenceDays } from '../../../utils';
import { FitbitIntradayHeartRateResult } from './types';
import { toDate } from 'date-fns-tz';

export class FitbitHeartRateMeasure extends FitbitMeasureBase {
  protected scope: string = 'heartrate';
  spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.heart);

  async fetchData(start: number, end: number): Promise<Array<IHeartRatePoint>> {
    const result: Array<FitbitIntradayHeartRateResult> = await Promise.all(sequenceDays(start, end).map(day => this.castedSource<FitbitSource>().fetchFitbitQuery(makeFitbitHeartRateIntradayUrl(day))))
    const timeZone = await this.castedSource<FitbitSource>().getUserTimezone()

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
  }
}
