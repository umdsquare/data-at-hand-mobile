import { DataSourceMeasure } from "../DataSource";
import { MeasureSpec } from "../../MeasureSpec";
import { measureService, MeasureSpecKey } from "../../../system/MeasureService";

export class AppleHealthStepMeasure extends DataSourceMeasure{
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.step)
    dependencies = [];

}