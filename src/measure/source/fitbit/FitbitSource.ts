import {DataService, UnSupportedReason} from '../DataService';
import {FitbitStepMeasure} from './FitbitStepMeasure';
import {FitbitHeartRateMeasure} from './FitbitHeartRateMeasure';
import {AsyncStorageHelper} from '../../../system/AsyncStorageHelper';
import {refresh, authorize, revoke} from 'react-native-app-auth';
import {FitbitSleepMeasure} from './FitbitSleepMeasure';
import {FitbitWeightMeasure} from './FitbitWeightMeasure';
import {FitbitWorkoutMeasure} from './FitbitWorkoutMeasure';
import { Moment } from 'moment';
import { FitbitUserProfile } from './types';

type TimeLike = Date|number|string|Moment

interface FitbitCredential {
  readonly client_secret: string;
  readonly client_id: string;
  readonly redirect_uri: string;
}

const FITBIT_DATE_FORMAT = 'YYYY-MM-DD';

const FITBIT_ACTIVITY_SUMMARY_URL = "https://api.fitbit.com/1/user/-/activities/date/{date}.json"
const FITBIT_INTRADAY_ACTIVITY_API_URL = `https://api.fitbit.com/1/user/-/{resourcePath}/date/{date}/1d/15min/time/{startTime}/{endTime}.json`;
const FITBIT_SLEEP_LOGS_URL =
  'https://api.fitbit.com/1.2/user/-/sleep/date/{startDate}/{endDate}.json';
const FITBIT_WEIGHT_LOGS_URL =
  'https://api.fitbit.com/1/user/-/body/weight/date/[startDate]/[endDate].json';

const FITBIT_HEARTRATE_LOGS_URL =
  'https://api.fitbit.com/1/user/-/activities/heart/date/{date}/1d/1min/time/{startTime}/{endTime}.json';


const FITBIT_PROFILE_URL = "https://api.fitbit.com/1/user/-/profile.json"

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

export function makeFitbitSleepApiUrl(startDate: TimeLike, endDate: TimeLike): string {
  const moment = require('moment');
  const stringFormat = require('string-format');
  return stringFormat(FITBIT_SLEEP_LOGS_URL, {
    startDate: moment(startDate).format(FITBIT_DATE_FORMAT),
    endDate: moment(endDate).format(FITBIT_DATE_FORMAT),
  });
}

export function makeFitbitWeightApiUrl(startDate: TimeLike, endDate: TimeLike): string {
  const moment = require('moment');
  const stringFormat = require('string-format');
  return stringFormat(FITBIT_WEIGHT_LOGS_URL, {
    startDate: moment(startDate).format(FITBIT_DATE_FORMAT),
    endDate: moment(endDate).format(FITBIT_DATE_FORMAT),
  });
}

export function makeFitbitHeartRateIntradayUrl(
  date: TimeLike
): string {
  const moment = require('moment');
  const stringFormat = require('string-format');
  return stringFormat(FITBIT_HEARTRATE_LOGS_URL, {
    date: moment(date).format(FITBIT_DATE_FORMAT),
    startTime: "00:00",
    endTime: "23:59",
  });
}

export function makeFitbitDailyActivitySummaryUrl(date: TimeLike): string{
  const moment = require('moment');
  const stringFormat = require('string-format');
  return stringFormat(FITBIT_ACTIVITY_SUMMARY_URL, {
    date: moment(date).format(FITBIT_DATE_FORMAT)
  })
}

const STORAGE_KEY_AUTH_STATE = DataService.STORAGE_PREFIX + 'fitbit:state';
const STORAGE_KEY_USER_TIMEZONE = DataService.STORAGE_PREFIX + "fitbit:user_timezone"
const STORAGE_KEY_AUTH_CURRENT_SCOPES =
  DataService.STORAGE_PREFIX + 'fitbit:scopes';

async function registerScopeAndGet(scope: string): Promise<Array<string>> {
  const currentScopes = await AsyncStorageHelper.getObject(
    STORAGE_KEY_AUTH_CURRENT_SCOPES,
  );
  if (currentScopes) {
    if (currentScopes.indexOf(scope) >= 0) {
      return currentScopes;
    } else {
      currentScopes.push(scope);
      await AsyncStorageHelper.set(
        STORAGE_KEY_AUTH_CURRENT_SCOPES,
        currentScopes,
      );
      return currentScopes;
    }
  } else {
    const newScopes = [scope];
    await AsyncStorageHelper.set(STORAGE_KEY_AUTH_CURRENT_SCOPES, newScopes);
    return newScopes;
  }
}



async function revokeScopeAndGet(
  scope: string,
): Promise<{removed: boolean; result: Array<string>}> {
  const currentScopes = (await AsyncStorageHelper.getObject(
    STORAGE_KEY_AUTH_CURRENT_SCOPES,
  )) as Array<string>;
  if (currentScopes) {
    const scopeIndex = currentScopes.indexOf(scope);
    if (scopeIndex >= 0) {
      currentScopes.splice(scopeIndex, 1);
      await AsyncStorageHelper.set(
        STORAGE_KEY_AUTH_CURRENT_SCOPES,
        currentScopes,
      );
      return {removed: true, result: currentScopes};
    } else {
      return {removed: false, result: currentScopes};
    }
  } else {
    return {removed: false, result: []};
  }
}

export class FitbitSource extends DataService {
  key: string = 'fitbit';
  name: string = 'Fitbit';
  description: string = 'Fitbit Fitness Tracker';
  thumbnail = require('../../../../assets/images/services/service_fitbit.jpg');

  supportedMeasures = [
    new FitbitStepMeasure(this),
    new FitbitHeartRateMeasure(this),
    new FitbitSleepMeasure(this),
    new FitbitWeightMeasure(this),
    new FitbitWorkoutMeasure(this),
  ];

  private _credential: FitbitCredential = null;
  private _authConfigBase = null;
  get credential(): FitbitCredential {
    return this._credential;
  }

  private async makeConfig(scope: string=null): Promise<any> {
    const scopes = scope? await registerScopeAndGet(scope) : (await AsyncStorageHelper.getObject(
      STORAGE_KEY_AUTH_CURRENT_SCOPES,
    )) as Array<string>;
    if(scopes.indexOf("profile") === -1){
      scopes.push("profile")
    }
    const copiedConfig = JSON.parse(JSON.stringify(this._authConfigBase));
    copiedConfig.scopes = scopes;
    return copiedConfig;
  }

  async checkTokenValid(): Promise<boolean> {
    const state = await AsyncStorageHelper.getObject(STORAGE_KEY_AUTH_STATE);
    return (
      state != null &&
      new Date(state.accessTokenExpirationDate).getTime() > Date.now()
    );
  }

  async authenticate(scope: string=null): Promise<string> {
    const state = await AsyncStorageHelper.getObject(STORAGE_KEY_AUTH_STATE);
    if (state) {
      try {
        const newState = await refresh(await this.makeConfig(scope), {
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
      const newState = await authorize(await this.makeConfig(scope));
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
    const state = await AsyncStorageHelper.getObject(STORAGE_KEY_AUTH_STATE);
    if (state) {
      await revoke(this._authConfigBase, {tokenToRevoke: state.refreshToken});
      await AsyncStorageHelper.remove(STORAGE_KEY_AUTH_STATE);
      await AsyncStorageHelper.remove(STORAGE_KEY_USER_TIMEZONE)
    }
  }

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
  }

  async updateUserProfile(): Promise<boolean>{
    return this.fetchFitbitQuery(FITBIT_PROFILE_URL).then((profile: FitbitUserProfile) => {
      if(profile != null){
        return AsyncStorageHelper.set(STORAGE_KEY_USER_TIMEZONE, profile.user.timezone).then(()=>true)
      }else return false
    })
  }

  async getUserTimezone(): Promise<string>{
    const cached = await AsyncStorageHelper.getString(STORAGE_KEY_USER_TIMEZONE)
    if(cached){
      return cached
    }else{
      const updated = await this.updateUserProfile()
      if(updated===true){
        return this.getUserTimezone()
      }else return null
    }
  }

  async fetchFitbitQuery(url: string): Promise<any> {
    console.log('fetch query for ', url);
    const state = await AsyncStorageHelper.getObject(STORAGE_KEY_AUTH_STATE);
    return fetch(url, {
      method: 'GET',
      headers: {
        'Accept-Language': 'en_US',
        Authorization: 'Bearer ' + state.accessToken,
        'Content-Type': 'application/json',
      },
    }).then(async (result) => {
      if(result.ok === false){
        if(result.status === 401){
          const json = await result.json()
          if(json.errors[0].errorType === 'expired_token'){
            console.log("Fitbit token is expired. refresh token and try once again.")
            return this.authenticate().then(token => this.fetchFitbitQuery(url))
          }else throw {error: "Access token invalid."}
        }else throw {error: result.status}          
      }else return result.json()
    })
  }

  protected onCheckSupportedInSystem(): Promise<{
    supported: boolean;
    reason?: UnSupportedReason;
  }> {
    try {
      this._credential = require('../../../../credentials/fitbit.json');
      this._authConfigBase = {
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
