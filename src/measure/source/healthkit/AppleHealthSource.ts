import { DataSource, UnSupportedReason } from "../DataSource";
import { Platform } from "react-native";
import { AppleHealthStepMeasure } from "./AppleHealthStepMeasure";

export class AppleHealthSource extends DataSource{

    key: string = "healthkit"
    name: string = "Apple Health"
    description: string = "Apple Health and HealthKit Data"
    
  thumbnail = require("../../../../assets/images/services/service_apple.jpg")

    protected onCheckSupportedInSystem(): Promise<{ supported: boolean; reason?: UnSupportedReason; }> {
        if(Platform.OS === "ios"){
            return Promise.resolve({supported: true})
        }else{
            return Promise.resolve({supported: false, reason: UnSupportedReason.OS})
        }
    }

    supportedMeasures = [new AppleHealthStepMeasure(this)]
}