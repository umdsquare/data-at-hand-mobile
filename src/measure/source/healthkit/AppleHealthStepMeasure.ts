import { DataSourceMeasure } from "../DataSource";
import { MeasureSpec } from "../../MeasureSpec";
import { measureService, MeasureSpecKey } from "../../../system/MeasureService";

export class AppleHealthStepMeasure extends DataSourceMeasure{
    activateInSystem(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    deactivatedInSystem(): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.step)
    dependencies = [];

}