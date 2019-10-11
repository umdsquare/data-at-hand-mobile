import { measureService, MeasureSpecKey } from '../../../system/MeasureService';
import { MeasureSpec } from "../../MeasureSpec";
import { FitbitMeasureBase } from "./FitbitMeasureBase";

export class FitbitStepMeasure extends FitbitMeasureBase{
    protected scope: string = "activity"
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.step)
}