import { DataService, UnSupportedReason, ServiceActivationResult } from '../DataService';
import * as HK from './HealthKitManager';
import { DataSourceType, IntraDayDataSourceType } from '@data-at-hand/core/measure/DataSourceSpec';
import { Platform } from 'react-native';
import { FilteredDailyValues, GroupedData, GroupedRangeData, IAggregatedValue, IAggregatedRangeValue } from '@core/exploration/data/types';
import { DataDrivenQuery } from '@data-at-hand/core/exploration/ExplorationInfo';
import { CyclicTimeFrame, CycleDimension } from '@data-at-hand/core/exploration/CyclicTimeFrame';

export default class AppleHealthService extends DataService {

  key: string = 'healthkit';
  name: string = 'Apple Health';
  description: string = 'Apple Health and HealthKit Data';

  thumbnail = require('@assets/images/services/service_apple.jpg');

  isQuotaLimited: boolean = false

  protected async onCheckSupportedInSystem(): Promise<{ supported: boolean; reason?: UnSupportedReason; }> {
    if (Platform.OS === 'ios') {
      const healthKitSupported = await HK.isHealthDataAvailable();
      if (healthKitSupported === true) {
        return { supported: true };
      }
    } else {
      return { supported: false, reason: UnSupportedReason.OS };
    }
  }

  isDataSourceSupported(dataSource: DataSourceType): boolean {
    //Check iOS 11 to support Resting Heart Rate. 
    if(dataSource === DataSourceType.HeartRate){
      const majorVersionIOS = parseInt(Platform.Version.toString(), 10);
      return majorVersionIOS >= 11
    }else return true
  }

  async activateInSystem(progressHandler: (progressInfo: { progress: number; message: string; }) => void): Promise<ServiceActivationResult> {
    progressHandler({progress: 0, message: "Checking HealthKit permissions..."})
    try {
      const hkPermissionResult = await HK.requestPermissions()
      if (hkPermissionResult === true) {
        return {
          success: true
        } as ServiceActivationResult
      } else {
        return {
          success: false,
          error: null
        }
      }
    } catch (err) {
      console.log(err)
      return {
        success: false,
        error: err
      }
    }
  }

  async deactivatedInSystem(): Promise<boolean> {
    return true
  }

  async onSystemExit(): Promise<void> {
    return
  }

  getDataInitialDate(): Promise<number> {
    return HK.getInitialTrackingDate()
  }

  async getGoalValue(dataSource: DataSourceType): Promise<number> {
    //Apple HealthKit does not provide goal values that are supported in Data@Hand.
    return undefined
  }
  getPreferredValueRange(dataSource: DataSourceType): Promise<[number, number]> {
    throw new Error("Method not implemented.");
  }
  fetchFilteredDates(filter: DataDrivenQuery, start: number, end: number): Promise<{ [key: number]: boolean; }> {
    throw new Error("Method not implemented.");
  }
  fetchIntraDayData(intraDayDataSource: IntraDayDataSourceType, date: number): Promise<any> {
    throw new Error("Method not implemented.");
  }
  protected fetchDataImpl(dataSource: DataSourceType, start: number, end: number, includeStatistics: boolean, includeToday: boolean): Promise<any> {
    throw new Error("Method not implemented.");
  }
  fetchCyclicAggregatedData(dataSource: DataSourceType, start: number, end: number, cycle: CyclicTimeFrame): Promise<GroupedData | GroupedRangeData> {
    throw new Error("Method not implemented.");
  }
  fetchRangeAggregatedData(dataSource: DataSourceType, start: number, end: number): Promise<IAggregatedValue | IAggregatedRangeValue> {
    throw new Error("Method not implemented.");
  }
  protected fetchCycleRangeDimensionDataImpl(dataSource: DataSourceType, start: number, end: number, cycleDimension: CycleDimension): Promise<IAggregatedRangeValue[] | IAggregatedValue[]> {
    throw new Error("Method not implemented.");
  }
  fetchCycleDailyDimensionData(dataSource: DataSourceType, start: number, end: number, cycleDimension: CycleDimension): Promise<FilteredDailyValues> {
    throw new Error("Method not implemented.");
  }


  async clearAllCache(): Promise<void> {
    return
  }

  async getLeftQuota(): Promise<number> {
    return Number.MAX_SAFE_INTEGER
  }
  async getQuotaResetEpoch(): Promise<number> {
    return 0
  }

  protected exportToCsv(): Promise<{ name: string; csv: string; }[]> {
    throw new Error("Method not implemented.");
  }
}
