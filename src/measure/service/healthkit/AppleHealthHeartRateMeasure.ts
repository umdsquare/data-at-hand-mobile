import { AppleHealthMeasureBase } from "./AppleHealthMeasureBase";
import * as HK from "./HealthKitManager";
import { MeasureSpec } from "../../MeasureSpec";
import { measureService, MeasureSpecKey } from "@measure/DataSourceManager";
import { HKPointMeasure } from "./types";
import { IHeartRatePoint } from "../../../database/types";

export class AppleHealthHeartRateMeasure extends AppleHealthMeasureBase<HKPointMeasure>{
   
    healthKitDataType = HK.HealthDataType.HeartRate
    spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.heart)

    protected convert(hkDatum: HKPointMeasure): IHeartRatePoint {
        return {
            value: hkDatum.value,
            measuredAt: new Date(hkDatum.measuredAt),
            measureCode: this.code,
            subjectToChange: false
        }
    }
}