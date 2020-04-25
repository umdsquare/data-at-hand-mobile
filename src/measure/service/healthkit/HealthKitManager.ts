import {NativeModules} from 'react-native';

export enum HealthDataType {
    Step = "step",
    HeartRate = "heartrate",
    Sleep = 'sleep',
    Workout = "workout",
    Weight = "weight"
}

export function isHealthDataAvailable(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    NativeModules.HealthKitManager.isAvailableInSystem((error: any | undefined | null, result: {available: boolean}) => {
      if (error) {
        reject(error);
      } else {
        resolve(result.available);
      }
    });
  });
}

export function requestPermissions(): Promise<boolean> {
  return new Promise((resolve, reject) => {
      NativeModules.HealthKitManager.requestPermissions((error: any | undefined | null, result: {approved: boolean})=>{
          if(error){
            reject(error)
          }else{
            resolve(result.approved)
          }
      })
  });
}

export function getInitialTrackingDate(): Promise<number>{
  return new Promise((resolve, reject)=>{
    NativeModules.HealthKitManager.getInitialTrackingDate((error: any | undefined | null, result: {initialDate: number})=>{
      if(error){
        reject(error)
      }else{
        resolve(result.initialDate)
      }
    })
  })
}