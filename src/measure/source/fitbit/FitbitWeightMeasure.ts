import {FitbitMeasureBase} from './FitbitMeasureBase';
import {MeasureSpec} from '../../MeasureSpec';
import {measureService, MeasureSpecKey} from '../../../system/MeasureService';
import {IDatumBase, IWeightPoint} from '../../../database/types';
import { FitbitSource, makeFitbitWeightApiUrl } from './FitbitSource';
import { FitbitWeightQueryResult } from './types';
import moment from 'moment';

export class FitbitWeightMeasure extends FitbitMeasureBase {
  protected scope: string = 'weight';
  spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.weight);

  async fetchData(start: number, end: number): Promise<Array<IDatumBase>> {
    const result: FitbitWeightQueryResult = await this.castedSource<FitbitSource>().fetchFitbitQuery(makeFitbitWeightApiUrl(start, end))
    return result.weight.map(weightLog => ({
      measureCode: this.code,
      value: weightLog.weight,
      measuredAt: moment(weightLog.date + "T" + weightLog.time).toDate()
    } as IWeightPoint))
  }
}
