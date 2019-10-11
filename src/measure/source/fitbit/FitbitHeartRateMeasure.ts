import {measureService, MeasureSpecKey} from '../../../system/MeasureService';
import {MeasureSpec} from '../../MeasureSpec';
import {FitbitSource} from './FitbitSource';
import { FitbitMeasureBase } from './FitbitMeasureBase';

export class FitbitHeartRateMeasure extends FitbitMeasureBase {
    protected scope: string = "heartrate"
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.heart);

}
