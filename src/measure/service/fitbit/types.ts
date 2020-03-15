import { SleepStage } from "../../../core/exploration/data/types";
import { UnSupportedReason } from "../DataService";
import { FitbitLocalDbManager } from "./sqlite/database";
import { LocalAsyncStorageHelper } from "@utils/AsyncStorageHelper";

export interface FitbitUserProfile {
  user: {
    age: number;
    fullName: string;
    dateOfBirth: string;
    timezone: string;
    memberSince: any;
    weightUnit: any;
  };
}

export interface FitbitIntradayStepDayQueryResult {
  'activities-steps': [{ dateTime: string; value: string }];
  'activities-steps-intraday': {
    dataset: Array<{ time: string; value: number }>;
  };
}

export interface FitbitSleepQueryResult {
  sleep: Array<{
    isMainSleep: boolean; // false => nap
    dateOfSleep: string; // yyyy-MM-dd
    endTime: string; // yyyy-MM-ddThh:mm:ss.sss
    startTime: string;
    efficiency: number; // sleep score
    duration: number; // millisecond
    logId: number;
    type: 'stages' | 'classic';
    levels: {
      data: Array<{
        dateTime: string;
        level: SleepStage;
        seconds: number;
      }>
    };
    summary: any;
    /*
    "summary": {
          "deep": {
            "count": 4,
            "minutes": 69,
            "thirtyDayAvgMinutes": 0
          },
          "light": {
            "count": 32,
            "minutes": 216,
            "thirtyDayAvgMinutes": 0
          },
          "rem": {
            "count": 7,
            "minutes": 75,
            "thirtyDayAvgMinutes": 0
          },
          "wake": {
            "count": 31,
            "minutes": 68,
            "thirtyDayAvgMinutes": 0
          }
        }
      },
    */
  }>;
}

export interface FitbitDailyActivityStepsQueryResult {
  'activities-steps': Array<{
    dateTime: string;
    value: string;
  }>;
}

export interface FitbitDailyActivityHeartRateQueryResult {
  'activities-heart': Array<{
    dateTime: string;
    value: {
      restingHeartRate: number;
      customHeartRateZones: Array<any>;
      heartRateZones: Array<{
        caloriesOut: number;
        max: number;
        min: number;
        minutes: number;
        name: string | "Out of Range" | "Fat Burn" | "Cardio" | "Peak";
      }>;
    };
  }>;
}

export interface FitbitHeartRateIntraDayQueryResult extends FitbitDailyActivityHeartRateQueryResult {
  "activities-heart-intraday": {
    dataset: Array<{
      time: string,
      value: number
    }>
  }
}

export interface FitbitActivitySummaryDay {
  activities: Array<{
    activityId: number;
    activityParentId: number;
    activityParentName: string;
    calories: number;
    description: string;
    duration: number;
    hasStartTime: boolean;
    isFavorite: boolean;
    lastModified: string;
    logId: number;
    name: string;
    startDate: string;
    startTime: string;
    steps: number;
  }>;
}

export interface FitbitWeightQueryResult {
  weight: Array<{
    logId: number;
    date: string;
    time: string;
    source: string;
    weight: number;
    bmi: number;
  }>;
}

export interface FitbitWeightTrendQueryResult {
  'body-weight': Array<{
    dateTime: string;
    value: string;
  }>;
}

export interface FitbitIntradayHeartRateResult {
  'activities-heart': [
    {
      dateTime: string; // carries date string
    },
  ];
  'activities-heart-intraday': {
    dataset: Array<{
      time: string /* carries only time of the day */;
      value: number;
    }>;
  };
}

export type FitbitDeviceListQueryResult = Array<{
      battery: "High",
      batteryLevel: number,
      deviceVersion: "MobileTrack" | string,
      id: string,
      lastSyncTime: string, //ISO8601
      type: "TRACKER" | "SCALE"
  }>

export interface FitbitServiceCore {

  keyOverride?: string
  nameOverride?: string
  descriptionOverride?: string
  thumbnailOverride?: any

  /** 
   * return: accessToken
   */
  authenticate(): Promise<string>
  signOut(): Promise<void> 

  onCheckSupportedInSystem(): Promise<{
    supported: boolean;
    reason?: UnSupportedReason;
  }>

  getMembershipStartDate(): Promise<number>

  fetchHeartRateDailySummary(start: number, end: number): Promise<FitbitDailyActivityHeartRateQueryResult>
  fetchStepDailySummary(start: number, end: number): Promise<FitbitDailyActivityStepsQueryResult>
  fetchWeightTrend(start: number, end: number): Promise<FitbitWeightTrendQueryResult>
  fetchWeightLogs(start: number, end: number): Promise<FitbitWeightQueryResult>
  fetchSleepLogs(start: number, end: number): Promise<FitbitSleepQueryResult>

  fetchIntradayStepCount(date: number): Promise<FitbitIntradayStepDayQueryResult>
  fetchIntradayHeartRate(date: number): Promise<FitbitHeartRateIntraDayQueryResult>

  fetchLastSyncTime(): Promise<{tracker?: Date, scale?: Date}>


  fitbitLocalDbManager: FitbitLocalDbManager
  localAsyncStorage: LocalAsyncStorageHelper

  getToday(): Date
}