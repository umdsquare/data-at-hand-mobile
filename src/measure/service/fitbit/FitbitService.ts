import {DataService, UnSupportedReason, ServiceActivationResult} from '../DataService';
import {AsyncStorageHelper} from '../../../system/AsyncStorageHelper';
import {refresh, authorize, revoke} from 'react-native-app-auth';
import {Moment} from 'moment';
import {FitbitUserProfile} from './types';
import {DataSourceType} from '../../DataSourceSpec';
import {DataLevel, IDatumBase} from '../../../database/types';
import { format } from 'date-fns';
import { FitbitDailyStepMeasure } from './FitbitDailyStepMeasure';
import { FitbitDailyHeartRateMeasure } from './FitbitDailyHeartRateMeasure';
import { FitbitWeightLogMeasure } from './FitbitWeightLogMeasure';
import { FitbitSleepMeasure } from './FitbitSleepMeasure';
import { DateTimeHelper } from '../../../time';

type TimeLike = Date | number | string | Moment;

interface FitbitCredential {
  readonly client_secret: string;
  readonly client_id: string;
  readonly redirect_uri: string;
}

export const FITBIT_DATE_FORMAT = 'yyyy-MM-dd';

const FITBIT_ACTIVITY_SUMMARY_URL =
  'https://api.fitbit.com/1/user/-/activities/date/{date}.json';
const FITBIT_INTRADAY_ACTIVITY_API_URL = `https://api.fitbit.com/1/user/-/{resourcePath}/date/{date}/1d/15min/time/{startTime}/{endTime}.json`;
const FITBIT_DAY_LEVEL_ACTIVITY_API_URL = `https://api.fitbit.com/1/user/-/{resourcePath}/date/{startDate}/{endDate}.json`;

const FITBIT_SLEEP_LOGS_URL =
  'https://api.fitbit.com/1.2/user/-/sleep/date/{startDate}/{endDate}.json';

const FITBIT_WEIGHT_TREND_URL =
  'https://api.fitbit.com/1/user/-/body/weight/date/{startDate}/{endDate}.json';
  

const FITBIT_WEIGHT_LOGS_URL =
  'https://api.fitbit.com/1/user/-/body/log/weight/date/{startDate}/{endDate}.json';

const FITBIT_HEARTRATE_LOGS_URL =
  'https://api.fitbit.com/1/user/-/activities/heart/date/{date}/1d/1min/time/{startTime}/{endTime}.json';

const FITBIT_PROFILE_URL = 'https://api.fitbit.com/1/user/-/profile.json';

/**
 *
 *
 * @param config start and end time must be within the same date
 */
export function makeFitbitIntradayActivityApiUrl(
  resourcePath: string,
  date: Date,
): string {
  const moment = require('moment');
  const stringFormat = require('string-format');
  const dateFormat = moment(date);
  return stringFormat(FITBIT_INTRADAY_ACTIVITY_API_URL, {
    resourcePath: resourcePath,
    date: dateFormat.format(FITBIT_DATE_FORMAT),
    startTime: '00:00',
    endTime: '23:59',
  });
}

export function makeFitbitSleepApiUrl(
  startDate: Date,
  endDate: Date,
): string {
  const stringFormat = require('string-format');
  return stringFormat(FITBIT_SLEEP_LOGS_URL, {
    startDate: format(startDate, FITBIT_DATE_FORMAT),
    endDate: format(endDate, FITBIT_DATE_FORMAT),
  });
}

export function makeFitbitWeightLogApiUrl(
  startDate: Date,
  endDate: Date,
): string {
  const stringFormat = require('string-format');
  return stringFormat(FITBIT_WEIGHT_LOGS_URL, {
    startDate: format(startDate, FITBIT_DATE_FORMAT),
    endDate: format(endDate, FITBIT_DATE_FORMAT),
  });
}

export function makeFitbitWeightTrendApiUrl(
  startDate: Date,
  endDate: Date,
): string {
  const stringFormat = require('string-format');
  return stringFormat(FITBIT_WEIGHT_TREND_URL, {
    startDate: format(startDate, FITBIT_DATE_FORMAT),
    endDate: format(endDate, FITBIT_DATE_FORMAT),
  });
}



export function makeFitbitHeartRateIntradayUrl(date: TimeLike): string {
  const moment = require('moment');
  const stringFormat = require('string-format');
  return stringFormat(FITBIT_HEARTRATE_LOGS_URL, {
    date: moment(date).format(FITBIT_DATE_FORMAT),
    startTime: '00:00',
    endTime: '23:59',
  });
}

export function makeFitbitDailyActivitySummaryUrl(date: TimeLike): string {
  const moment = require('moment');
  const stringFormat = require('string-format');
  return stringFormat(FITBIT_ACTIVITY_SUMMARY_URL, {
    date: moment(date).format(FITBIT_DATE_FORMAT),
  });
}

export function makeFitbitDayLevelActivityLogsUrl(resourcePath: string, startDate: Date, endDate: Date): string {
  const stringFormat = require('string-format');
  return stringFormat(FITBIT_DAY_LEVEL_ACTIVITY_API_URL, {
    resourcePath,
    startDate: format(startDate, FITBIT_DATE_FORMAT),
    endDate: format(endDate, FITBIT_DATE_FORMAT)
  })
}

const STORAGE_KEY_AUTH_STATE = DataService.STORAGE_PREFIX + 'fitbit:state';
const STORAGE_KEY_USER_TIMEZONE =
  DataService.STORAGE_PREFIX + 'fitbit:user_timezone';

const STORAGE_KEY_USER_MEMBER_SINCE = DataService.STORAGE_PREFIX + 'fitbit:user_memberSince';


export class FitbitService extends DataService {
  key: string = 'fitbit';
  name: string = 'Fitbit';
  description: string = 'Fitbit Fitness Tracker';
  thumbnail = require('../../../../assets/images/services/service_fitbit.jpg');

  private _credential: FitbitCredential = null;
  private _authConfig = null;

  get credential(): FitbitCredential {
    return this._credential;
  }

  isDataSourceSupported(dataSource: DataSourceType): boolean {
    return true;
  }

  private dailyStepMeasure = new FitbitDailyStepMeasure(this)
  private dailyHeartRateMeasure = new FitbitDailyHeartRateMeasure(this)
  private weightLogMeasure = new FitbitWeightLogMeasure(this)
  private sleepMeasure = new FitbitSleepMeasure(this)


  protected fetchDataImpl(
    dataSource: DataSourceType,
    level: DataLevel,
    from: Date,
    to: Date,
  ): Promise<IDatumBase[]> {
    switch (dataSource) {
      case DataSourceType.StepCount:
        if(level === DataLevel.DailyActivity){
          return this.dailyStepMeasure.fetchData(from, to)
        }else{

        }
        break;
      case DataSourceType.HeartRate:
        if(level === DataLevel.DailyActivity){
          return this.dailyHeartRateMeasure.fetchData(from, to)
        }
        break;
      case DataSourceType.HoursSlept:
        break;
      case DataSourceType.SleepRange:
        if(level === DataLevel.DailyActivity){
          return this.sleepMeasure.fetchData(from, to)
        }
        break;
      case DataSourceType.Weight:
        return this.weightLogMeasure.fetchData(from, to)
        break;
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
    console.log("try fitbit sign out")
    const state = await AsyncStorageHelper.getObject(STORAGE_KEY_AUTH_STATE);
    if (state) {
      await revoke(this._authConfig, {tokenToRevoke: state.refreshToken, includeBasicAuth: true} as any);
      await AsyncStorageHelper.remove(STORAGE_KEY_AUTH_STATE);
      await AsyncStorageHelper.remove(STORAGE_KEY_USER_TIMEZONE);
      await AsyncStorageHelper.remove(STORAGE_KEY_USER_MEMBER_SINCE);
    }
  }

  async activateInSystem(): Promise<ServiceActivationResult> {
    try {
      const accessToken = await this.authenticate();
      if (accessToken != null) {
        const initialDate = await this.getMembershipStartDate();
        return {
          success: true,
          serviceInitialDate: initialDate
        }
      } else return {
        success: false 
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

  /*
  async revokeScope(scope: string): Promise<boolean> {
    const scopeRevokeResult = await revokeScopeAndGet(scope);
    if (scopeRevokeResult.removed === true) {
      if (scopeRevokeResult.result.length === 1) {
        try {
          await this.signOut();
          return true;
        } catch (e) {
          console.log(e);
          return false;
        }
      } else {
        try {
          const state = await AsyncStorageHelper.getObject(
            STORAGE_KEY_AUTH_STATE,
          );
          const newState = await refresh(
            {...this._authConfigBase, scopes: scopeRevokeResult.result},
            {
              refreshToken: state.refreshToken,
            },
          );
          if (newState) {
            await AsyncStorageHelper.set(STORAGE_KEY_AUTH_STATE, newState);
            return true;
          }
        } catch (e) {
          console.log(e);
          return false;
        }
      }
    }
    return true;
  }*/

  async updateUserProfile(): Promise<boolean> {
    const profile: FitbitUserProfile = await this.fetchFitbitQuery(FITBIT_PROFILE_URL)
    console.log(profile)
    if (profile != null) {
      await AsyncStorageHelper.set(STORAGE_KEY_USER_TIMEZONE, profile.user.timezone)
      await AsyncStorageHelper.set(STORAGE_KEY_USER_MEMBER_SINCE, DateTimeHelper.fromFormattedString(profile.user.memberSince))
      return true
    } else return false;
  }

  async getMembershipStartDate(): Promise<number>{
    console.log("get membership start date")
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
    var accessToken
    if(state==null || state.accessToken == null){
        accessToken = await this.authenticate()
    }else accessToken = state.accessToken

    return fetch(url, {
      method: 'GET',
      headers: {
        'Accept-Language': null, // METRIC
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
    }).then(async result => {

      const quota = result.headers.get("Fitbit-Rate-Limit-Limit")
      const remainedCalls = result.headers.get("Fitbit-Rate-Limit-Remaining")
      const secondsLeftToNextReset = result.headers.get("Fitbit-Rate-Limit-Reset")

      if (result.ok === false) {
        const json = await result.json();
        switch(result.status){
          case 401:
            if (json.errors[0].errorType === 'expired_token') {
              console.log(
                'Fitbit token is expired. refresh token and try once again.',
              );
              return this.authenticate().then(token =>
                this.fetchFitbitQuery(url),
              );
            } else throw {error: 'Access token invalid.'};

          case 429:
            throw {error: "Fitbit quota limit reached. Next reset: " + secondsLeftToNextReset + " secs."}
          default:
            throw {error: result.status};
        }
      } else {
        console.log("Fitbit API call succeeded. Remaining quota:", remainedCalls+"/"+quota, "next reset:", secondsLeftToNextReset + " secs.")
        return result.json()
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
