import { AppleHealthMeasureBase } from "./AppleHealthMeasureBase";
import * as HK from "./HealthKitManager";
import { MeasureSpec } from "../../MeasureSpec";
import { measureService, MeasureSpecKey } from "../../../system/MeasureService";

export class AppleHealthHeartRateMeasure extends AppleHealthMeasureBase{
    healthKitDataType = HK.HealthDataType.HeartRate
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.heart)
}