import { AppleHealthMeasureBase } from "./AppleHealthMeasureBase";
import * as HK from "./HealthKitManager";
import { MeasureSpec } from "../../MeasureSpec";
import { measureService, MeasureSpecKey } from "../../../system/MeasureService";

export class AppleHealthWorkoutMeasure extends AppleHealthMeasureBase{
    healthKitDataType = HK.HealthDataType.Workout
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.workout)
}