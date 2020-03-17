import {DataService, UnSupportedReason} from '../DataService';
import {Platform} from 'react-native';
import {AppleHealthStepMeasure} from './AppleHealthStepMeasure';
import * as HK from './HealthKitManager';
import {DataServiceManager} from '@measure/DataServiceManager';
import { DataSourceType } from '../../DataSourceSpec';
import { DataLevel, IDatumBase } from '../../../database/types';

export class AppleHealthService extends DataService {
  
  key: string = 'healthkit';
  name: string = 'Apple Health';
  description: string = 'Apple Health and HealthKit Data';

  thumbnail = require('@assets/images/services/service_apple.jpg');

  private supportedDataTypes = [HK.HealthDataType.Step, HK.HealthDataType.Sleep, HK.HealthDataType.Weight, HK.HealthDataType.HeartRate]

  protected async onCheckSupportedInSystem(): Promise<{
    supported: boolean;
    reason?: UnSupportedReason;
  }> {
    if (Platform.OS === 'ios') {
      const healthKitSupported = await HK.isHealthDataAvailable();
      if (healthKitSupported === true) {
        return {supported: true};
      }
    } else {
      return {supported: false, reason: UnSupportedReason.OS};
    }
  }

  isDataSourceSupported(dataSource: DataSourceType): boolean {
    return true
  }
  protected fetchDataImpl(dataSource: DataSourceType, level: DataLevel, from: Date, to: Date): Promise<IDatumBase[]> {
    return Promise.resolve([])
  }
  activateInSystem(): Promise<boolean> {
    return HK.requestPermissions(this.supportedDataTypes)
  }
  deactivatedInSystem(): Promise<boolean> {
    return Promise.resolve(true)
  }
/*
  async getSelectedDataTypes(): Promise<Array<HK.HealthDataType>> {
    return (await DataServiceManager.getMeasuresOfService(this)).map(
      measure => (measure as AppleHealthMeasureBase<any>).healthKitDataType,
    );
  }*/
}
