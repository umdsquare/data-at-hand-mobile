import { DataMeasure } from "../DataService";
import { MeasureSpec } from "../../MeasureSpec";
import { measureService, MeasureSpecKey } from "@measure/DataSourceManager";
import * as HealthKitManager from './HealthKitManager';
import { AppleHealthMeasureBase } from "./AppleHealthMeasureBase";
import { HKStepDatum } from "./types";
import { IHourlyStepBin } from "../../../database/types";


export class AppleHealthStepMeasure extends AppleHealthMeasureBase<HKStepDatum>{
    
    healthKitDataType: HealthKitManager.HealthDataType = HealthKitManager.HealthDataType.Step
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.step)

    protected convert(hkDatum: HKStepDatum): IHourlyStepBin {
        return {
            value: hkDatum.value,
            startedAt: new Date(hkDatum.startedAt),
            measureCode: this.code,
            subjectToChange: false
        }
    }
}