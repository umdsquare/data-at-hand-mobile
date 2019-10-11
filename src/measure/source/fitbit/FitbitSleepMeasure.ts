import { MeasureSpec } from "../../MeasureSpec";
import { measureService, MeasureSpecKey } from "../../../system/MeasureService";
import { FitbitMeasureBase } from "./FitbitMeasureBase";

export class FitbitSleepMeasure extends FitbitMeasureBase{
    protected scope: string = "sleep"
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.sleep)
}