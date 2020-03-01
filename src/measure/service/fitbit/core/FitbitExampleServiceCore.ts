import { FitbitServiceCore, FitbitDailyActivityHeartRateQueryResult, FitbitDailyActivityStepsQueryResult, FitbitWeightTrendQueryResult, FitbitWeightQueryResult, FitbitSleepQueryResult, FitbitIntradayStepDayQueryResult, FitbitHeartRateIntraDayQueryResult } from "../types";
import { FitbitLocalDbManager } from "../sqlite/database";
import { DatabaseParams } from "react-native-sqlite-storage";
import { UnSupportedReason } from "../../DataService";
import { max, min } from "d3-array";
import { DateTimeHelper } from "../../../../time";
import { getDay, differenceInDays, startOfDay, addSeconds, format } from "date-fns";
import { LocalAsyncStorageHelper } from "../../../../system/AsyncStorageHelper";

interface ExampleDayRow {
    index: number,
    date: string,
    numberedDate: number,
    year: number,
    month: number,
    dayOfWeek: number,
    step: number,
    sleepLengthSeconds: number,
    bedTimeDiffSeconds: number,
    wakeTimeDiffSeconds: number,
    bpm: number,
    kg: number,
    step_fake: boolean,
    sleep_fake: boolean,

}

export class FitbitExampleServiceCore implements FitbitServiceCore {

    nameOverride = "Fitbit (Example Data)"
    keyOverride = "fitbit_example"

    private _exampleData: Array<ExampleDayRow> = null
    get exampleData(): Array<ExampleDayRow> {
        if (this._exampleData == null) {
            this._exampleData = require("../../../../../assets/data/example_data_generated")
            this._exampleData.sort((a, b) => {
                if (a.numberedDate < b.numberedDate) {
                    return -1
                } else if (a.numberedDate === b.numberedDate) {
                    return 0
                } else return 1
            })
        }

        return this._exampleData
    }

    private filterRowsWithinRange(start: number, end: number): Array<ExampleDayRow> {

        if (this.exampleData[0].numberedDate <= end
            && this.exampleData[this.exampleData.length - 1].numberedDate >= start) {
            //start from zero
            let startIndex: number
            for (startIndex = 0; startIndex < this.exampleData.length; startIndex++) {
                if (this.exampleData[startIndex].numberedDate >= start) {
                    break;
                }
            }

            let endIndex: number

            for (endIndex = this.exampleData.length - 1; endIndex >= 0; endIndex--) {
                if (this.exampleData[endIndex].numberedDate <= end) {
                    break;
                }
            }

            return this.exampleData.slice(startIndex, endIndex + 1)
        } else return []
    }

    private _fitbitLocalDbManager: FitbitLocalDbManager = null

    private _asyncStorage: LocalAsyncStorageHelper = null

    get fitbitLocalDbManager(): FitbitLocalDbManager {
        if (this._fitbitLocalDbManager == null) {
            this._fitbitLocalDbManager = new FitbitLocalDbManager({
                name: 'fitbit-example-dataset.sqlite',
                location: 'default',
            } as DatabaseParams);
        }
        return this._fitbitLocalDbManager;
    }

    get localAsyncStorage(): LocalAsyncStorageHelper {
        if(this._asyncStorage == null){
            this._asyncStorage = new LocalAsyncStorageHelper("fitbit:official")
        }
        return this._asyncStorage
    }

    private _latestDate: Date = null
    private _earliestNumberedDate: number = null

    async authenticate(): Promise<string> {
        const latestDateInData = DateTimeHelper.toDate(max(this.exampleData, d => d.numberedDate))
        this._latestDate = latestDateInData
        this._earliestNumberedDate = min(this.exampleData, d => d.numberedDate)
        const latestDateDayOfWeek = getDay(latestDateInData)
        const now = startOfDay(new Date())
        const nowDayOfWeek = getDay(now)

        //number of weeks to add to cover today. (To maintain Days of the week in the data)
        //const deltaDays = differenceInDays(now, latestDateInData) + ((7 + latestDateDayOfWeek - nowDayOfWeek)%7)

        return "EXAMPLE_ACCESS_TOKEN"
    }

    async signOut(): Promise<void> {
        return
    }

    async onCheckSupportedInSystem(): Promise<{ supported: boolean; reason?: UnSupportedReason; }> {
        return { supported: true }
    }

    async getMembershipStartDate(): Promise<number> {
        return this._earliestNumberedDate
    }

    async fetchHeartRateDailySummary(start: number, end: number): Promise<FitbitDailyActivityHeartRateQueryResult> {
        return {
            "activities-heart": this.filterRowsWithinRange(start, end).map(e => ({
                dateTime: DateTimeHelper.toFormattedString(e.numberedDate),
                value: {
                    restingHeartRate: e.bpm,
                    customHeartRateZones: [],
                    heartRateZones: []
                }
            }))
        }
    }

    async fetchStepDailySummary(start: number, end: number): Promise<FitbitDailyActivityStepsQueryResult> {
        return {
            "activities-steps": this.filterRowsWithinRange(start, end).map(e => ({ dateTime: DateTimeHelper.toFormattedString(e.numberedDate), value: e.step.toFixed(0) }))
        }
    }

    async fetchWeightTrend(start: number, end: number): Promise<FitbitWeightTrendQueryResult> {
        return {
            "body-weight": this.filterRowsWithinRange(start, end).map(e => ({
                dateTime: DateTimeHelper.toFormattedString(e.numberedDate),
                value: e.kg.toFixed(0)
            }))
        }
    }

    async fetchWeightLogs(start: number, end: number): Promise<FitbitWeightQueryResult> {
        return {
            weight: []
        }
    }

    async fetchSleepLogs(start: number, end: number): Promise<FitbitSleepQueryResult> {
        const result = {
            sleep: this.filterRowsWithinRange(start, end).map(e => ({
                isMainSleep: true,
                dateOfSleep: DateTimeHelper.toFormattedString(e.numberedDate),
                minutesAsleep: e.sleepLengthSeconds / 60,
                duration: e.sleepLengthSeconds * 1000,
                startTime: format(addSeconds(DateTimeHelper.toDate(e.numberedDate), e.bedTimeDiffSeconds), "yyyy-MM-dd'T'HH:mm:ss"),
                endTime: format(addSeconds(DateTimeHelper.toDate(e.numberedDate), e.wakeTimeDiffSeconds), "yyyy-MM-dd'T'HH:mm:ss"),
                type: 'stages' as any,
                levels: { data: [] },
                summary: {},
                efficiency: 100,
                logId: e.index
            }))
        }
        return result
    }

    async fetchIntradayStepCount(date: number): Promise<FitbitIntradayStepDayQueryResult> {
        return {
            'activities-steps': [{ dateTime: DateTimeHelper.toFormattedString(date), value: "0" }],
            'activities-steps-intraday': {
                dataset: []
            }
        }
    }

    async fetchIntradayHeartRate(date: number): Promise<FitbitHeartRateIntraDayQueryResult> {
        return {
            "activities-heart-intraday": {
                dataset: []
            },
            "activities-heart": []
        }
    }

    getToday() {
        return this._latestDate || new Date()
    }

    async fetchLastSyncTime(): Promise<{ tracker?: Date, scale?: Date }> {
        return {
            tracker: this._latestDate,
            scale: this._latestDate
        }
    }
}