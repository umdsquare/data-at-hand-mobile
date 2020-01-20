import {AppleHealthMeasureBase} from './AppleHealthMeasureBase';
import * as HK from './HealthKitManager';
import {MeasureSpec} from '../../MeasureSpec';
import {measureService, MeasureSpecKey} from '../../../system/MeasureService';
import {HKPointMeasure} from './types';
import {IWeightPoint} from '../../../database/types';

export class AppleHealthWeightMeasure extends AppleHealthMeasureBase<
  HKPointMeasure
> {
  healthKitDataType = HK.HealthDataType.Weight;
  spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.weight);

  protected convert(hkDatum: HKPointMeasure): IWeightPoint {
    return {
      value: hkDatum.value,
      measuredAt: new Date(hkDatum.measuredAt),
      measuredUsing: null,
      measureCode: this.code,
      subjectToChange: false,
    };
  }
}
