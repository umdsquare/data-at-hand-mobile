import { DataSourceMeasure } from "../DataSource";

import { measureService, MeasureSpecKey } from '../../../system/MeasureService';
import { MeasureSpec } from "../../MeasureSpec";

export class FitbitStepMeasure extends DataSourceMeasure{
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.step)
}