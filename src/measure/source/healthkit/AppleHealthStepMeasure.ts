import { DataSourceMeasure } from "../DataSource";
import { MeasureSpec } from "../../MeasureSpec";
import { measureService, MeasureSpecKey } from "../../../system/MeasureService";
import * as HealthKitManager from './HealthKitManager';
import { AppleHealthMeasureBase } from "./AppleHealthMeasureBase";


export class AppleHealthStepMeasure extends AppleHealthMeasureBase{
    healthKitDataType: HealthKitManager.HealthDataType = HealthKitManager.HealthDataType.Step
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.step)
}