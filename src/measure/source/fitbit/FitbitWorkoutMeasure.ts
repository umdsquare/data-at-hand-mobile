import { FitbitMeasureBase } from "./FitbitMeasureBase";
import { MeasureSpec } from "../../MeasureSpec";
import { measureService, MeasureSpecKey } from "../../../system/MeasureService";

export class FitbitWorkoutMeasure extends FitbitMeasureBase{
    protected scope: string = "activity"
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.workout)


}