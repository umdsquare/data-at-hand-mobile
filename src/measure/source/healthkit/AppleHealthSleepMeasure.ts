import { AppleHealthMeasureBase } from "./AppleHealthMeasureBase";
import * as HK from "./HealthKitManager";
import { MeasureSpec } from "../../MeasureSpec";
import { measureService, MeasureSpecKey } from "../../../system/MeasureService";

export class AppleHealthSleepMeasure extends AppleHealthMeasureBase{
    healthKitDataType = HK.HealthDataType.Sleep
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.sleep)
}