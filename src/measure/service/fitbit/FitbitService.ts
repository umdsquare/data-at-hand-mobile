import {
  DataService,
  UnSupportedReason,
  ServiceActivationResult,
} from '../DataService';
import {AsyncStorageHelper} from '../../../system/AsyncStorageHelper';
import {refresh, authorize, revoke} from 'react-native-app-auth';
import {FitbitUserProfile} from './types';
import {DataSourceType} from '../../DataSourceSpec';
import {FitbitDailyStepMeasure} from './FitbitDailyStepMeasure';
import {FitbitDailyHeartRateMeasure} from './FitbitDailyHeartRateMeasure';
import {DateTimeHelper} from '../../../time';
import {FITBIT_PROFILE_URL} from './api';
import {FitbitServiceMeasure} from './FitbitServiceMeasure';
import {FitbitWeightMeasure} from './FitbitWeightMeasure';
import {FitbitSleepMeasure} from './FitbitSleepMeasure';
import {FitbitLocalDbManager} from './sqlite/database';
import {FitbitIntraDayStepMeasure} from './FitbitIntraDayStepMeasure';
import {IntraDayDataSourceType} from '../../../core/exploration/types';
import {FitbitIntraDayHeartRateMeasure} from './FitbitIntraDayHeartRateMeasure';

interface FitbitCredential {
  readonly client_secret: string;
  readonly client_id: string;
  readonly redirect_uri: string;
}

const STORAGE_KEY_AUTH_STATE = DataService.STORAGE_PREFIX + 'fitbit:state';
const STORAGE_KEY_USER_TIMEZONE =
  DataService.STORAGE_PREFIX + 'fitbit:user_timezone';

const STORAGE_KEY_USER_MEMBER_SINCE =
  DataService.STORAGE_PREFIX + 'fitbit:user_memberSince';

export class FitbitService extends DataService {
  key: string = 'fitbit';
  name: string = 'Fitbit';
  description: string = 'Fitbit Fitness Tracker';
  thumbnail = require('../../../../assets/images/services/service_fitbit.jpg');

  private _credential: FitbitCredential = null;
  private _authConfig = null;

  private _fitbitLocalDbManager: FitbitLocalDbManager = new FitbitLocalDbManager();
  get fitbitLocalDbManager(): FitbitLocalDbManager {
    return this._fitbitLocalDbManager;
  }

  get credential(): FitbitCredential {
    return this._credential;
  }

  isDataSourceSupported(dataSource: DataSourceType): boolean {
    return true;
  }

  private dailyStepMeasure = new FitbitDailyStepMeasure(this);
  private dailyHeartRateMeasure = new FitbitDailyHeartRateMeasure(this);
  private weightLogMeasure = new FitbitWeightMeasure(this);
  private sleepMeasure = new FitbitSleepMeasure(this);

  private intradayStepMeasure = new FitbitIntraDayStepMeasure(this);
  private intradayHeartRateMeasure = new FitbitIntraDayHeartRateMeasure(this);

  private preloadableMeasures: Array<FitbitServiceMeasure> = [
    this.dailyStepMeasure,
    this.dailyHeartRateMeasure,
    this.weightLogMeasure,
    this.sleepMeasure,
  ];

  protected async fetchDataImpl(
    dataSource: DataSourceType,
    start: number,
    end: number,
  ): Promise<any> {
    switch (dataSource) {
      case DataSourceType.StepCount:
        console.log('try get fitbit step data from db');
        return await this.dailyStepMeasure.fetchData(start, end);

      case DataSourceType.HeartRate:
        console.log('try get fitbit HR data from db');
        return await this.dailyHeartRateMeasure.fetchData(start, end);
        break;
      case DataSourceType.HoursSlept:
      case DataSourceType.SleepRange:
        return await this.sleepMeasure.fetchData(dataSource, start, end);
      case DataSourceType.Weight:
        return await this.weightLogMeasure.fetchData(start, end);
    }
  }

  async fetchIntraDayData(
    intraDayDataSource: IntraDayDataSourceType,
    date: number,
  ): Promise<any> {
    const now = DateTimeHelper.toNumberedDateFromDate(new Date());
    if (date <= now) {
      switch (intraDayDataSource) {
        case IntraDayDataSourceType.StepCount:
          return await this.intradayStepMeasure.fetchData(date);
        case IntraDayDataSourceType.HeartRate:
          return await this.intradayHeartRateMeasure.fetchData(date);
      }
    }
    return null;
  }

  async checkTokenValid(): Promise<boolean> {
    const state = await AsyncStorageHelper.getObject(STORAGE_KEY_AUTH_STATE);
    return (
      state != null &&
      new Date(state.accessTokenExpirationDate).getTime() > Date.now()
    );
  }

  /***
   * return: Access token
   */
  async authenticate(): Promise<string> {
    const state = await AsyncStorageHelper.getObject(STORAGE_KEY_AUTH_STATE);
    if (state) {
      try {
        const newState = await refresh(this._authConfig, {
          refreshToken: state.refreshToken,
        });
        if (newState) {
          await AsyncStorageHelper.set(STORAGE_KEY_AUTH_STATE, newState);
          return newState.accessToken;
        }
      } catch (e) {
        console.log(e);
      }
    }

    try {
      const newState = await authorize(this._authConfig);
      if (newState) {
        await AsyncStorageHelper.set(STORAGE_KEY_AUTH_STATE, newState);
        return newState.accessToken;
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }

  async signOut(): Promise<void> {
    console.log('try fitbit sign out');
    const state = await AsyncStorageHelper.getObject(STORAGE_KEY_AUTH_STATE);
    if (state) {
      await revoke(this._authConfig, {
        tokenToRevoke: state.refreshToken,
        includeBasicAuth: true,
      } as any);
      await AsyncStorageHelper.remove(STORAGE_KEY_AUTH_STATE);
      await AsyncStorageHelper.remove(STORAGE_KEY_USER_TIMEZONE);
      await AsyncStorageHelper.remove(STORAGE_KEY_USER_MEMBER_SINCE);
      await this.fitbitLocalDbManager.close();
      await this.fitbitLocalDbManager.deleteDatabase();
    }
  }

  async activateInSystem(): Promise<ServiceActivationResult> {
    try {
      const accessToken = await this.authenticate();
      if (accessToken != null) {
        const initialDate = await this.getMembershipStartDate();
        const now = DateTimeHelper.toNumberedDateFromDate(new Date());

        await this.fitbitLocalDbManager.open();

        for (const measure of this.preloadableMeasures) {
          await measure.cacheServerData(now);
        }

        return {
          success: true,
          serviceInitialDate: initialDate,
        };
      } else
        return {
          success: false,
        };
    } catch (ex) {
      console.log(ex);
      return {success: false, error: ex};
    }
  }

  async deactivatedInSystem(): Promise<boolean> {
    try {
      await this.signOut();
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async onSystemExit(): Promise<void> {
    await this.fitbitLocalDbManager.close();
  }

  async updateUserProfile(): Promise<boolean> {
    const profile: FitbitUserProfile = await this.fetchFitbitQuery(
      FITBIT_PROFILE_URL,
    );
    console.log(profile);
    if (profile != null) {
      await AsyncStorageHelper.set(
        STORAGE_KEY_USER_TIMEZONE,
        profile.user.timezone,
      );
      await AsyncStorageHelper.set(
        STORAGE_KEY_USER_MEMBER_SINCE,
        DateTimeHelper.fromFormattedString(profile.user.memberSince),
      );
      return true;
    } else return false;
  }

  async getMembershipStartDate(): Promise<number> {
    console.log('get membership start date');
    const cached = await AsyncStorageHelper.getLong(
      STORAGE_KEY_USER_MEMBER_SINCE,
    );
    if (cached) {
      return cached;
    } else {
      const updated = await this.updateUserProfile();
      if (updated === true) {
        return this.getMembershipStartDate();
      } else return null;
    }
  }

  async getUserTimezone(): Promise<string> {
    const cached = await AsyncStorageHelper.getString(
      STORAGE_KEY_USER_TIMEZONE,
    );
    if (cached) {
      return cached;
    } else {
      const updated = await this.updateUserProfile();
      if (updated === true) {
        return this.getUserTimezone();
      } else return null;
    }
  }

  async fetchFitbitQuery(url: string): Promise<any> {
    console.log('fetch query for ', url);
    const state = await AsyncStorageHelper.getObject(STORAGE_KEY_AUTH_STATE);
    var accessToken;
    if (state == null || state.accessToken == null) {
      accessToken = await this.authenticate();
    } else accessToken = state.accessToken;

    return fetch(url, {
      method: 'GET',
      headers: {
        'Accept-Language': null, // METRIC
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
    }).then(async result => {
      const quota = result.headers.get('Fitbit-Rate-Limit-Limit');
      const remainedCalls = result.headers.get('Fitbit-Rate-Limit-Remaining');
      const secondsLeftToNextReset = result.headers.get(
        'Fitbit-Rate-Limit-Reset',
      );

      if (result.ok === false) {
        const json = await result.json();
        switch (result.status) {
          case 401:
            if (json.errors[0].errorType === 'expired_token') {
              console.log(
                'Fitbit token is expired. refresh token and try once again.',
              );
              return this.authenticate().then(() => this.fetchFitbitQuery(url));
            } else throw {error: 'Access token invalid.'};

          case 429:
            throw {
              error:
                'Fitbit quota limit reached. Next reset: ' +
                secondsLeftToNextReset +
                ' secs.',
            };
          default:
            throw {error: result.status};
        }
      } else {
        console.log(
          'Fitbit API call succeeded. Remaining quota:',
          remainedCalls + '/' + quota,
          'next reset:',
          secondsLeftToNextReset + ' secs.',
        );
        return result.json();
      }
    });
  }

  protected onCheckSupportedInSystem(): Promise<{
    supported: boolean;
    reason?: UnSupportedReason;
  }> {
    try {
      this._credential = require('../../../../credentials/fitbit.json');
      this._authConfig = {
        scopes: ['profile', 'activity', 'weight', 'sleep', 'heartrate'],
        clientId: this._credential.client_id,
        clientSecret: this._credential.client_secret,
        redirectUrl: this._credential.redirect_uri,
        serviceConfiguration: {
          authorizationEndpoint: 'https://www.fitbit.com/oauth2/authorize',
          tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
          revocationEndpoint: 'https://api.fitbit.com/oauth2/revoke',
        },
      };
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
