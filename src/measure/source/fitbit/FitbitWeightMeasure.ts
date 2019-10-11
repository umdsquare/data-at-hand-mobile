import { FitbitMeasureBase } from "./FitbitMeasureBase";
import { MeasureSpec } from "../../MeasureSpec";
import { measureService, MeasureSpecKey } from "../../../system/MeasureService";

export class FitbitWeightMeasure extends FitbitMeasureBase{
    protected scope: string = "weight"
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.weight)
}