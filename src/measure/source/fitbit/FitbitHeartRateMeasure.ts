import { DataSourceMeasure } from "../DataSource";
import { measureService, MeasureSpecKey } from '../../../system/MeasureService';
import { MeasureSpec } from "../../MeasureSpec";

export class FitbitHeartRateMeasure extends DataSourceMeasure{
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.heart)
}