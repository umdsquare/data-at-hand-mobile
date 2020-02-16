import { refresh, authorize, revoke } from 'react-native-app-auth';
import { FitbitServiceCore, FitbitDailyActivityHeartRateQueryResult, FitbitDailyActivityStepsQueryResult, FitbitWeightTrendQueryResult, FitbitWeightQueryResult, FitbitSleepQueryResult, FitbitIntradayStepDayQueryResult, FitbitHeartRateIntraDayQueryResult, FitbitUserProfile } from "../types";
import { makeFitbitIntradayActivityApiUrl, makeFitbitHeartRateIntraDayLogApiUrl, makeFitbitWeightTrendApiUrl, makeFitbitWeightLogApiUrl, makeFitbitDayLevelActivityLogsUrl, makeFitbitSleepApiUrl, FITBIT_PROFILE_URL } from "../api";
import { AsyncStorageHelper } from "../../../../system/AsyncStorageHelper";
import { DataService, UnSupportedReason } from "../../DataService";
import { DateTimeHelper } from "../../../../time";
import { FitbitLocalDbManager } from '../sqlite/database';
import { DatabaseParams } from 'react-native-sqlite-storage';


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

export class FitbitOfficialServiceCore implements FitbitServiceCore {

    private _credential: FitbitCredential = null;
    private _authConfig = null;

    private _fitbitLocalDbManager: FitbitLocalDbManager = null

    get fitbitLocalDbManager(): FitbitLocalDbManager {
        if (this._fitbitLocalDbManager == null) {
            this._fitbitLocalDbManager = new FitbitLocalDbManager({
                name: 'fitbit-local-cache.sqlite',
                location: 'default',
            } as DatabaseParams);
        }
        return this._fitbitLocalDbManager;
    }

    private get credential(): FitbitCredential {
        return this._credential;
    }

    private async checkTokenValid(): Promise<boolean> {
        const state = await AsyncStorageHelper.getObject(STORAGE_KEY_AUTH_STATE);
        return (
            state != null &&
            new Date(state.accessTokenExpirationDate).getTime() > Date.now()
        );
    }

    private async updateUserProfile(): Promise<boolean> {
        const profile: FitbitUserProfile = await this.fetchFitbitQuery(
            FITBIT_PROFILE_URL,
        );
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

    async authenticate(): Promise<string> {
        const state = await AsyncStorageHelper.getObject(STORAGE_KEY_AUTH_STATE);
        if (state) {
            try {
                console.log("refresh token found. try refreshing it with token...")
                const newState = await refresh(this._authConfig, {
                    refreshToken: state.refreshToken,
                });
                if (newState) {
                    console.log("token refresh succeeded.")
                    await AsyncStorageHelper.set(STORAGE_KEY_AUTH_STATE, newState);
                    return newState.accessToken;
                }
            } catch (e) {
                console.log("token refresh failed. try re-authorize.")
                console.log(e);
            }
        }

        try {
            console.log("try re-authorization.")
            const newState = await authorize(this._authConfig);
            await AsyncStorageHelper.set(STORAGE_KEY_AUTH_STATE, newState);
            return newState.accessToken;
        } catch (e) {
            console.log("Authorization failed.")
            console.log(e, JSON.stringify(e))
            return null;
        }
    }

    onCheckSupportedInSystem(): Promise<{ supported: boolean, reason?: UnSupportedReason }> {
        try {
            this._credential = require('../../../../../credentials/fitbit.json');
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
            return Promise.resolve({ supported: true });
        } catch (e) {
            console.log(e);
            return Promise.resolve({
                supported: false,
                reason: UnSupportedReason.Credential,
            });
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
        }
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
                        } else throw { error: 'Access token invalid.' };

                    case 429:
                        throw {
                            error:
                                'Fitbit quota limit reached. Next reset: ' +
                                secondsLeftToNextReset +
                                ' secs.',
                        };
                    default:
                        throw { error: result.status };
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

    fetchHeartRateDailySummary(start: number, end: number): Promise<FitbitDailyActivityHeartRateQueryResult> {
        return this.fetchFitbitQuery(makeFitbitDayLevelActivityLogsUrl('activities/heart', start, end))
    }

    fetchStepDailySummary(start: number, end: number): Promise<FitbitDailyActivityStepsQueryResult> {
        return this.fetchFitbitQuery(makeFitbitDayLevelActivityLogsUrl("activities/steps", start, end))
    }

    fetchWeightTrend(start: number, end: number): Promise<FitbitWeightTrendQueryResult> {
        return this.fetchFitbitQuery(makeFitbitWeightTrendApiUrl(start, end))
    }

    fetchWeightLogs(start: number, end: number): Promise<FitbitWeightQueryResult> {
        return this.fetchFitbitQuery(makeFitbitWeightLogApiUrl(start, end))
    }

    fetchSleepLogs(start: number, end: number): Promise<FitbitSleepQueryResult> {
        return this.fetchFitbitQuery(makeFitbitSleepApiUrl(start, end))
    }

    fetchIntradayStepCount(date: number): Promise<FitbitIntradayStepDayQueryResult> {
        return this.fetchFitbitQuery(makeFitbitIntradayActivityApiUrl("activities/steps", date))
    }

    fetchIntradayHeartRate(date: number): Promise<FitbitHeartRateIntraDayQueryResult> {
        return this.fetchFitbitQuery(makeFitbitHeartRateIntraDayLogApiUrl(date))
    }
}