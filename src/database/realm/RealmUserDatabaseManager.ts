import { RealmHandlerBase } from "./RealmHandlerBase";
import { userRealmConfig } from './userdata-schema';
import { IUserDatabaseManager, IDatumBase } from "../types";
import { MeasureSpecKey, measureService } from "../../system/MeasureService";
import { DataServiceManager } from "../../system/DataServiceManager";

export class RealmUserDatabaseManager extends RealmHandlerBase implements IUserDatabaseManager {
    
    static tableNameDict = new Map<string, string>([
        [MeasureSpecKey.step, "HourlyStepBin"],
        [MeasureSpecKey.heart, "HeartRatePoint"],
        [MeasureSpecKey.weight, "WeightPoint"],
        [MeasureSpecKey.sleep, "SleepSession"],
        [MeasureSpecKey.workout, 'WorkoutSession']
    ])

    constructor(){
        super(userRealmConfig)
    }

    async queryData<T extends IDatumBase>(measureCode: string, from: number, to: number): Promise<T[]> {
        const measure = DataServiceManager.findMeasureByCode(measureCode)
        if(measure){
            const dataset = await measure.fetchData(from , to)
            return dataset as T[]
        }else throw {error: "NoSuchMeasureOf"}
    }


    clearCache(measureCode: string) {
        throw new Error("Method not implemented.");
    }
    
}