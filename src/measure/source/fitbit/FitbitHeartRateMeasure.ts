import { DataSourceMeasure } from "../DataSource";
import { measureService, MeasureSpecKey } from '../../../system/MeasureService';
import { MeasureSpec } from "../../MeasureSpec";
import { SourceDependency } from "../SourceDependency";
import { FitbitSource } from "./FitbitSource";

export class FitbitHeartRateMeasure extends DataSourceMeasure{
    get dependencies(): SourceDependency[] {
        return [this.castedSource<FitbitSource>().makeCredentialDependency("heartrate")]
    }
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.heart)
}