import {MeasureSpec} from '../../MeasureSpec';
import {measureService, MeasureSpecKey} from '../../../system/MeasureService';
import {FitbitMeasureBase} from './FitbitMeasureBase';
import { IDatumBase, ISleepSession } from '../../../database/types';
import { FitbitSource, makeFitbitSleepApiUrl } from './FitbitSource';
import { FitbitSleepQueryResult } from './types';
import { toDate } from 'date-fns-tz'

export class FitbitSleepMeasure extends FitbitMeasureBase {
  protected scope: string = 'sleep';
  spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.sleep);

  async fetchData(start: number, end: number): Promise<IDatumBase[]> {
    const result: FitbitSleepQueryResult = await this.castedService<FitbitSource>().fetchFitbitQuery(makeFitbitSleepApiUrl(start, end))
    const fitbitTimezone = await this.castedService<FitbitSource>().getUserTimezone()
    return result.sleep.map(log => {
      return {
        startedAt: toDate(log.startTime,{timeZone: fitbitTimezone}),
        endedAt: toDate(log.endTime, {timeZone: fitbitTimezone}),
        duration: log.duration,
        value: log.efficiency/100,
        measureCode: this.code,
        subjectToChange: false
      } as ISleepSession
    })
  }
}
