import {DataSource, UnSupportedReason} from '../DataSource';
import {FitbitStepMeasure} from './FitbitStepMeasure';
import {FitbitHeartRateMeasure} from './FitbitHeartRateMeasure';

interface FitbitCredential {
  readonly client_secret: string;
  readonly client_id: string;
}

export class FitbitSource extends DataSource {
    name: string = "Fitbit"
    description: string = "Fitbit Fitness Tracker"

  private _credential: FitbitCredential;
  get credential(): FitbitCredential {
    return this._credential;
  }

  supportedMeasures = [
    new FitbitStepMeasure(this),
    new FitbitHeartRateMeasure(this),
  ];

  protected onCheckSupportedInSystem(): Promise<{
    supported: boolean;
    reason?: UnSupportedReason;
  }> {
    try {
      this._credential = require('../../../../credentials/fitbit.json');
      return Promise.resolve({supported: true});
    } catch (e) {
      console.log(e);
      return Promise.resolve({
        supported: false,
        reason: UnSupportedReason.Credential,
      });
    }
  }
}
