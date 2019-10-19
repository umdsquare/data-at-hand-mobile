import {MeasureSpec} from '../../MeasureSpec';
import {measureService, MeasureSpecKey} from '../../../system/MeasureService';
import {FitbitMeasureBase} from './FitbitMeasureBase';
import { IDatumBase, ISleepSession } from '../../../database/types';
import { FitbitSource, makeFitbitSleepApiUrl } from './FitbitSource';
import { FitbitSleepQueryResult } from './types';
import moment from 'moment';

export class FitbitSleepMeasure extends FitbitMeasureBase {
  protected scope: string = 'sleep';
  spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.sleep);

  async fetchData(start: number, end: number): Promise<IDatumBase[]> {
    const result: FitbitSleepQueryResult = await this.castedSource<FitbitSource>().fetchFitbitQuery(makeFitbitSleepApiUrl(start, end))
    return result.sleep.map(log => {
      return {
        startedAt: moment(log.startTime).toDate(),
        endedAt: moment(log.endTime).toDate(),
        measureCode: this.code
      } as ISleepSession
    })
  }
}
