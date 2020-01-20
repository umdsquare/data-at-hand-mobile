import {FitbitMeasureBase} from './FitbitMeasureBase';
import {MeasureSpec} from '../../MeasureSpec';
import {measureService, MeasureSpecKey} from '../../../system/MeasureService';
import {IDatumBase, IWeightPoint} from '../../../database/types';
import { FitbitService, makeFitbitWeightApiUrl } from './FitbitService';
import { FitbitWeightQueryResult } from './types';
import { toDate } from 'date-fns-tz';

export class FitbitWeightMeasure extends FitbitMeasureBase {
  protected scope: string = 'weight';
  spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.weight);

  async fetchData(start: number, end: number): Promise<Array<IDatumBase>> {
    const result: FitbitWeightQueryResult = await this.castedService<FitbitService>().fetchFitbitQuery(makeFitbitWeightApiUrl(start, end))
    const timeZone = await this.castedService<FitbitService>().getUserTimezone()
    return result.weight.map(weightLog => ({
      measureCode: this.code,
      value: weightLog.weight,
      measuredAt: toDate(weightLog.date + "T" + weightLog.time, {timeZone: timeZone}),
      subjectToChange: false
    } as IWeightPoint))
  }
}
