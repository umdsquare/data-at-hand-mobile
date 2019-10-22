import {NativeModules} from 'react-native';
import { sourceManager } from '../../../system/SourceManager';

export enum HealthDataType {
    Step = "step",
    HeartRate = "heartrate",
    Sleep = 'sleep',
    Workout = "workout",
    Weight = "weight"
}

export function isHealthDataAvailable(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    NativeModules.HealthKitManager.isAvailableInSystem((error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result.available);
      }
    });
  });
}

export function requestPermissions(
  permissions: Array<HealthDataType>,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
      NativeModules.HealthKitManager.requestPermissions(permissions, (error, result)=>{
          if(error){
            reject(error)
          }else{
            resolve(result.approved)
          }
      })
  });
}

export function queryHealthData(
  from: Date,
  to: Date,
  dataType: HealthDataType
): Promise<Array<any>>{
  return new Promise((resolve, reject)=>{
    NativeModules.HealthKitManager.queryHealthData({
      from: from.getTime(), to: to.getTime(),
      dataType: dataType
    }, (error, result)=>{
      if(error){
        reject(error)
      }else{
        resolve(result)
      }
    })
  })
}