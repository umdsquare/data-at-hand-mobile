import { AppleHealthMeasureBase } from "./AppleHealthMeasureBase";
import * as HK from "./HealthKitManager";
import { MeasureSpec } from "../../MeasureSpec";
import { measureService, MeasureSpecKey } from "../../../system/MeasureService";

export class AppleHealthWeightMeasure extends AppleHealthMeasureBase{
    healthKitDataType = HK.HealthDataType.Weight
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.weight)
}