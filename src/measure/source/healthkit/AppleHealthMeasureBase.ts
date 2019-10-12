import { DataSourceMeasure } from "../DataSource";
import * as HK from './HealthKitManager';
import { AppleHealthSource } from "./AppleHealthSource";

export abstract  class AppleHealthMeasureBase extends DataSourceMeasure{
    abstract readonly healthKitDataType : HK.HealthDataType

    async activateInSystem(): Promise<boolean> {
        const dataTypes = await this.castedSource<AppleHealthSource>().getSelectedDataTypes()
        
        if(dataTypes.indexOf(this.healthKitDataType) < 0){
            dataTypes.push(this.healthKitDataType)
        }

        return HK.requestPermissions(dataTypes)
    }
    
    async deactivatedInSystem(): Promise<boolean> {
        return true
    }
}