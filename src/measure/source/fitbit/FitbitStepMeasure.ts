import { DataSourceMeasure } from "../DataSource";

import { measureService, MeasureSpecKey } from '../../../system/MeasureService';
import { MeasureSpec } from "../../MeasureSpec";
import { SourceDependency } from "../SourceDependency";
import { FitbitSource } from "./FitbitSource";

export class FitbitStepMeasure extends DataSourceMeasure{
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.step)
    
    get dependencies(): SourceDependency[] {
        return [this.castedSource<FitbitSource>().makeCredentialDependency("activity")]
    }
}