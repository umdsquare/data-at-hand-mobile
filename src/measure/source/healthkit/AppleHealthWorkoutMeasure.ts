import {AppleHealthMeasureBase} from './AppleHealthMeasureBase';
import * as HK from './HealthKitManager';
import {MeasureSpec} from '../../MeasureSpec';
import {measureService, MeasureSpecKey} from '../../../system/MeasureService';
import {HKWorkoutDatum, getHKWorkoutActivityTypeName} from './types';
import {IWorkoutSession} from '../../../database/types';

export class AppleHealthWorkoutMeasure extends AppleHealthMeasureBase<
  HKWorkoutDatum
> {
  healthKitDataType = HK.HealthDataType.Workout;
  spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.workout);

  protected convert(hkDatum: HKWorkoutDatum): IWorkoutSession {
    return {
      startedAt: new Date(hkDatum.startedAt),
      endedAt: new Date(hkDatum.endedAt),
      duration: hkDatum.endedAt - hkDatum.startedAt,
      activityType: getHKWorkoutActivityTypeName(hkDatum.activityTypeCode),
      value: null,
      measureCode: this.code,
      subjectToChange: false,
    };
  }
}
