import { refresh, authorize, revoke, AuthConfiguration } from 'react-native-app-auth';
import { FitbitServiceCore, FitbitDailyActivityHeartRateQueryResult, FitbitDailyActivityStepsQueryResult, FitbitWeightTrendQueryResult, FitbitWeightQueryResult, FitbitSleepQueryResult, FitbitIntradayStepDayQueryResult, FitbitHeartRateIntraDayQueryResult, FitbitUserProfile, FitbitDeviceListQueryResult } from "../types";
import { makeFitbitIntradayActivityApiUrl, makeFitbitHeartRateIntraDayLogApiUrl, makeFitbitWeightTrendApiUrl, makeFitbitWeightLogApiUrl, makeFitbitDayLevelActivityLogsUrl, makeFitbitSleepApiUrl, FITBIT_PROFILE_URL, FITBIT_DEVICES_URL, FITBIT_DAILY_STEP_GOAL_URL, FITBIT_SLEEP_GOAL_URL, FITBIT_WEIGHT_GOAL_URL } from "../api";
import { LocalAsyncStorageHelper } from "@utils/AsyncStorageHelper";
import { DataService, UnSupportedReason, ServiceApiErrorType } from "../../DataService";
import { DateTimeHelper } from "@data-at-hand/core/utils/time";
import { FitbitLocalDbManager, INTRADAY_SEPARATOR_BETWEEN } from '../sqlite/database';
import { DatabaseParams } from 'react-native-sqlite-storage';
import { parseISO, max } from 'date-fns';
import { SystemError } from '@utils/errors';
import { notifyError } from '@core/logging/ErrorReportingService';
import path from 'react-native-path';
import prompt from 'react-native-prompt-android';
import { Platform } from 'react-native';

interface FitbitCredential {
    readonly client_secret: string;
    readonly client_id: string;
    readonly redirect_uri: string;
    readonly prefetch_backend_uri?: string;
    readonly start_date_backend_uri?: string;
}

const STORAGE_KEY_USER_ID = DataService.STORAGE_PREFIX + "fitbit_backend:user_id";

const STORAGE_KEY_USER_MEMBER_SINCE =
    DataService.STORAGE_PREFIX + 'fitbit_backend:user_memberSince';

export default class FitbitOfficialServiceCore implements FitbitServiceCore {

    isPrefetchAvailable(): boolean {
        return this._credential?.prefetch_backend_uri != null
    }


    nameOverride = "Fitbit (Backend)"
    keyOverride = "fitbit_backend"

    descriptionOverride?: string;
    thumbnailOverride?: any;

    isQuotaLimited: boolean = false
    getLeftQuota(): Promise<number> {
        return Promise.resolve(Number.MAX_SAFE_INTEGER)
    }
    getQuotaResetEpoch(): Promise<number> {
        return Promise.resolve(Number.NaN)
    }

    private _credential: FitbitCredential | null = null;

    private _fitbitLocalDbManager: FitbitLocalDbManager | null = null
    private _asyncStorage: LocalAsyncStorageHelper | null = null

    get fitbitLocalDbManager(): FitbitLocalDbManager {
        if (this._fitbitLocalDbManager == null) {
            this._fitbitLocalDbManager = new FitbitLocalDbManager({
                name: 'fitbit-backend-local-cache.sqlite',
                location: 'default',
            } as DatabaseParams);
        }
        return this._fitbitLocalDbManager;
    }

    get localAsyncStorage(): LocalAsyncStorageHelper {
        if (this._asyncStorage == null) {
            this._asyncStorage = new LocalAsyncStorageHelper("fitbit:backend")
        }
        return this._asyncStorage
    }



    async authenticate(): Promise<string> {
        const code = await this.getFitbitUserId()
        if (code != null) {
            return code
        } else return new Promise<string | undefined>((resolve, reject) => {
            if (Platform.OS === 'android') {
                prompt("Insert User Code", "Please insert the user code you received from the experimenter.", [
                    { text: 'Cancel', onPress: () => resolve(null), style: 'cancel' },
                    { text: 'OK', onPress: code => resolve(code) },
                ],
                    {
                        type: 'default',
                        cancelable: false,
                        defaultValue: null,
                        placeholder: 'User Code'
                    })
            }
        }).then(async code => {
            if (code != null) {
                //get 
                try {
                    const membershipStartDateResult = await fetch(path.resolve(this._credential.start_date_backend_uri, code), {
                        method: "GET"
                    })

                    if (membershipStartDateResult.status === 200) {
                        const membershipStartDate = Number.parseInt(await membershipStartDateResult.json())
                        console.log("Membership start date: ", membershipStartDate)
                        await this.localAsyncStorage.set(
                            STORAGE_KEY_USER_MEMBER_SINCE,
                            membershipStartDate
                        );

                        await this.localAsyncStorage.set(
                            STORAGE_KEY_USER_ID,
                            code
                        );

                        return code
                    } else {
                        console.error("Fitbit start date query failed - ", membershipStartDateResult.status)
                        return null
                    }
                } catch (ex) {
                    console.error(ex)
                    notifyError(ex, (report) => {
                        report.context = "Fitbit Backend start date query"
                    })
                }
            } else return null
        })
    }

    async onCheckSupportedInSystem(): Promise<{ supported: boolean, reason?: UnSupportedReason }> {
        if (Platform.OS !== 'android') {
            return { supported: false, reason: UnSupportedReason.OS }
        }
        try {
            this._credential = require('@credentials/fitbit.json');
            return { supported: true };
        } catch (e) {
            console.log(e);
            return {
                supported: false,
                reason: UnSupportedReason.Credential,
            };
        }
    }

    async signOut(): Promise<void> {
        return
    }

    private async getFitbitUserId(): Promise<string | null> {
        const cached = await this.localAsyncStorage.getString(STORAGE_KEY_USER_ID)
        if (cached) {
            return cached
        } else return null
    }

    async getMembershipStartDate(): Promise<number> {
        return this.localAsyncStorage.getLong(
            STORAGE_KEY_USER_MEMBER_SINCE,
        );
    }

    private async fetchDataFromPrefetchBackend(dataSourceTableType: string, start: number, end: number): Promise<{ queryEndDate: number, queriedAt: number, result: Array<any> } | null> {
        try {
            if (this._credential?.prefetch_backend_uri != null) {
                console.log("Try getting prefetched data from server")

                const fitbitId = await this.getFitbitUserId()

                const fetchResult = await fetch(path.resolve(this._credential.prefetch_backend_uri, fitbitId, dataSourceTableType) + `?start=${start}&end=${end}`, {
                    method: "GET"
                })
                if (fetchResult.status === 200) {
                    const { crawlLog, data } = await fetchResult.json()
                    const prefetchedBy = crawlLog.queried_by_numbered_date
                    return {
                        queryEndDate: prefetchedBy,
                        queriedAt: crawlLog.queried_at,
                        result: data
                    }
                } else return null
            } else return null
        } catch (err) {
            console.log("error while using prefetch server:", err)
            return null
        }
    }


    private async fetchImpl<T>(dataSourceTableType: string, start: number, end: number, propertyName: string): Promise<T> {
        const prefetched = await this.fetchDataFromPrefetchBackend(dataSourceTableType, start, end)
        console.log("queried ", start, end)
        if (prefetched) {
            console.log("prefetched til", prefetched.queryEndDate)
            //mind the gap between the prefetched server and the queried date
            return { [propertyName]: prefetched.result, queryEndDate: prefetched.queryEndDate } as any as T
        } else return null
    }

    async fetchHeartRateDailySummary(start: number, end: number, prefetchMode: boolean): Promise<FitbitDailyActivityHeartRateQueryResult> {

        return this.fetchImpl<FitbitDailyActivityHeartRateQueryResult>("heartrate_daily", start, end, "activities-heart")
    }

    fetchStepDailySummary(start: number, end: number, prefetchMode: boolean): Promise<FitbitDailyActivityStepsQueryResult> {
        return this.fetchImpl<FitbitDailyActivityStepsQueryResult>("step_daily", start, end, "activities-steps")
    }

    fetchWeightTrend(start: number, end: number, prefetchMode: boolean): Promise<FitbitWeightTrendQueryResult> {
        return this.fetchImpl<FitbitWeightTrendQueryResult>("weight_trend", start, end, "body-weight")
    }

    fetchWeightLogs(start: number, end: number, prefetchMode: boolean): Promise<FitbitWeightQueryResult> {
        return this.fetchImpl<FitbitWeightQueryResult>("weight_log", start, end, "weight")
    }

    fetchSleepLogs(start: number, end: number, prefetchMode: boolean): Promise<FitbitSleepQueryResult> {
        return this.fetchImpl<FitbitSleepQueryResult>("sleep", start, end, "sleep")
    }

    async fetchIntradayStepCount(date: number): Promise<FitbitIntradayStepDayQueryResult> {
        return null
    }

    async fetchIntradayHeartRate(date: number): Promise<FitbitHeartRateIntraDayQueryResult> {
        return null
    }

    async prefetchIntradayStepCount(start: number, end: number): Promise<{ result: FitbitIntradayStepDayQueryResult[]; queriedAt: number; }> {
        return this.fetchDataFromPrefetchBackend("step_intraday", start, end)
    }

    prefetchIntradayHeartRate(start: number, end: number): Promise<{ result: FitbitHeartRateIntraDayQueryResult[]; queriedAt: number; }> {
        return this.fetchDataFromPrefetchBackend("heartrate_intraday", start, end)
    }

    async fetchStepCountGoal(): Promise<number | undefined> {
        return 10000
    }

    async fetchMinSleepDurationGoal(): Promise<number | undefined> {
        return undefined
    }

    fetchWeightGoal(): Promise<number | undefined> {
        return undefined
    }


    readonly getToday = () => {
        return new Date()
    }

    private _lastSyncTimePromise?: Promise<{ tracker?: Date, scale?: Date }> = null
    private _lastSyncTimeInvokedAt?: number = null

    async fetchLastSyncTime(): Promise<{ tracker?: Date, scale?: Date }> {
        return {
            tracker: new Date(),
            scale: new Date()
        }
    }
}