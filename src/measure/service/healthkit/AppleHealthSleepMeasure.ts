import {AppleHealthMeasureBase} from './AppleHealthMeasureBase';
import * as HK from './HealthKitManager';
import {MeasureSpec} from '../../MeasureSpec';
import {measureService, MeasureSpecKey} from '@measure/DataSourceManager';
import {HKSleepDatum} from './types';
import {ISleepSession} from '../../../database/types';

export class AppleHealthSleepMeasure extends AppleHealthMeasureBase<
  HKSleepDatum
> {
  healthKitDataType = HK.HealthDataType.Sleep;
  spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.sleep);

  protected convert(hkDatum: HKSleepDatum): ISleepSession {
    return {
        startedAt: new Date(hkDatum.startedAt),
        endedAt: new Date(hkDatum.endedAt),
        duration: hkDatum.endedAt - hkDatum.startedAt,
        value: hkDatum.effciency,
        measureCode: this.code,
        subjectToChange: false
    }
  }
}
