import {DataService, UnSupportedReason} from '../DataService';
import {Platform} from 'react-native';
import {AppleHealthStepMeasure} from './AppleHealthStepMeasure';
import * as HK from './HealthKitManager';
import {sourceManager} from '../../../system/SourceManager';
import {AppleHealthMeasureBase} from './AppleHealthMeasureBase';
import {AppleHealthHeartRateMeasure} from './AppleHealthHeartRateMeasure';
import {AppleHealthSleepMeasure} from './AppleHealthSleepMeasure';
import {AppleHealthWorkoutMeasure} from './AppleHealthWorkoutMeasure';
import {AppleHealthWeightMeasure} from './AppleHealthWeightMeasure';

export class AppleHealthService extends DataService {
  key: string = 'healthkit';
  name: string = 'Apple Health';
  description: string = 'Apple Health and HealthKit Data';

  thumbnail = require('../../../../assets/images/services/service_apple.jpg');

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

  supportedMeasures = [
    new AppleHealthStepMeasure(this),
    new AppleHealthWeightMeasure(this),
    new AppleHealthHeartRateMeasure(this),
    new AppleHealthSleepMeasure(this),
    new AppleHealthWorkoutMeasure(this),
  ];

  async getSelectedDataTypes(): Promise<Array<HK.HealthDataType>> {
    return (await sourceManager.getSourcesOfService(this)).map(
      measure => (measure as AppleHealthMeasureBase<any>).healthKitDataType,
    );
  }
}
