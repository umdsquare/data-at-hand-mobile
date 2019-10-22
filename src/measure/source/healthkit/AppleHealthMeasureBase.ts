import { DataSourceMeasure } from "../DataSource";
import * as HK from './HealthKitManager';
import { AppleHealthSource } from "./AppleHealthSource";
import { IDatumBase } from "../../../database/types";

export abstract class AppleHealthMeasureBase<HKDatumType> extends DataSourceMeasure{
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

    fetchData(start: number, end: number): Promise<Array<IDatumBase>>{
        return HK.queryHealthData(new Date(start), new Date(end), this.healthKitDataType).then(list => {
            return list.map(d => this.convert(d))
        })
    }

    protected abstract convert(hkDatum: HKDatumType): IDatumBase
}