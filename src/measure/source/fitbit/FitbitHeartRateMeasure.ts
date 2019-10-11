import {DataSourceMeasure} from '../DataSource';
import {measureService, MeasureSpecKey} from '../../../system/MeasureService';
import {MeasureSpec} from '../../MeasureSpec';
import {FitbitSource} from './FitbitSource';

export class FitbitHeartRateMeasure extends DataSourceMeasure {
  spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.heart);

  async activateInSystem(): Promise<boolean> {
    return this.castedSource<FitbitSource>().authenticate('heartrate');
  }

  async deactivatedInSystem(): Promise<boolean> {
    return this.castedSource<FitbitSource>().revokeScope("heartrate")
  }
}
