import { DataSourceMeasure } from "../DataSource";

import { measureService, MeasureSpecKey } from '../../../system/MeasureService';
import { MeasureSpec } from "../../MeasureSpec";
import { FitbitSource } from "./FitbitSource";

export class FitbitStepMeasure extends DataSourceMeasure{
   
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.step)
    
    async activateInSystem(): Promise<boolean> {
        return this.castedSource<FitbitSource>().authenticate("activity")
    }
    
    async deactivatedInSystem(): Promise<boolean> {
      return this.castedSource<FitbitSource>().revokeScope("heartrate")
    }
}