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
import {FitbitLocalCacheConfig} from './realm/schema';
import * as Realm from 'realm';
import {DataLevel} from '../../../core/exploration/types';
import {FITBIT_PROFILE_URL} from './api';
import {FitbitServiceMeasure} from './FitbitServiceMeasure';
import {FitbitWeightMeasure} from './FitbitWeightMeasure';
import { FitbitSleepMeasure } from './FitbitSleepMeasure';

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

  private _realm: Realm;

  get realm(): Realm {
    return this._realm;
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
  private sleepMeasure = new FitbitSleepMeasure(this)

  private measures: Array<FitbitServiceMeasure> = [
    this.dailyStepMeasure,
    this.dailyHeartRateMeasure,
    this.weightLogMeasure,
    this.sleepMeasure
  ];

  protected async fetchDataImpl(
    dataSource: DataSourceType,
    level: DataLevel,
    from: Date,
    to: Date,
  ): Promise<any> {
    if (level === DataLevel.DailyActivity) {
      switch (dataSource) {
        case DataSourceType.StepCount:
          console.log('try get fitbit step data from db');
          return await this.dailyStepMeasure.fetchData(from, to);

        case DataSourceType.HeartRate:
          if (level === DataLevel.DailyActivity) {
            console.log('try get fitbit HR data from db');
            return await this.dailyHeartRateMeasure.fetchData(from, to);
          }
          break;
        case DataSourceType.HoursSlept:
        case DataSourceType.SleepRange:
          if (level === DataLevel.DailyActivity) {
            return await this.sleepMeasure.fetchData(dataSource, from, to)
          }
          break;
        case DataSourceType.Weight:
          return await this.weightLogMeasure.fetchData(from, to);
      }

      return null;
    } else {
      return null;
    }
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
      Realm.deleteFile(FitbitLocalCacheConfig);
    }
  }

  async activateInSystem(): Promise<ServiceActivationResult> {
    try {
      const accessToken = await this.authenticate();
      if (accessToken != null) {
        const initialDate = await this.getMembershipStartDate();
        const now = DateTimeHelper.toNumberedDateFromDate(new Date());

        console.log('initialize new realm.');
        this._realm = await Realm.open(FitbitLocalCacheConfig);

        for (const measure of this.measures) {
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

  onSystemExit() {
    this._realm.close();
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
