import { FitbitServiceCore, FitbitDailyActivityHeartRateQueryResult, FitbitDailyActivityStepsQueryResult, FitbitWeightTrendQueryResult, FitbitWeightQueryResult, FitbitSleepQueryResult, FitbitIntradayStepDayQueryResult, FitbitHeartRateIntraDayQueryResult } from "../types";
import { FitbitLocalDbManager } from "../sqlite/database";
import { DatabaseParams } from "react-native-sqlite-storage";

export class FitbitExampleQuerySource implements FitbitServiceCore{
    

    private _fitbitLocalDbManager: FitbitLocalDbManager = null

    get fitbitLocalDbManager(): FitbitLocalDbManager {
        if (this._fitbitLocalDbManager == null) {
            this._fitbitLocalDbManager = new FitbitLocalDbManager({
                name: 'fitbit-example-dataset.sqlite',
                location: 'default',
            } as DatabaseParams);
        }
        return this._fitbitLocalDbManager;
    }

    authenticate(): Promise<string> {
        throw new Error("Method not implemented.");
    }
    signOut(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    onCheckSupportedInSystem(): Promise<{ supported: boolean; reason?: import("../../DataService").UnSupportedReason; }> {
        throw new Error("Method not implemented.");
    }
    getMembershipStartDate(): Promise<number> {
        throw new Error("Method not implemented.");
    }

    fetchHeartRateDailySummary(start: number, end: number): Promise<FitbitDailyActivityHeartRateQueryResult> {
        throw new Error("Method not implemented.");
    }    
    
    fetchStepDailySummary(start: number, end: number): Promise<FitbitDailyActivityStepsQueryResult> {
        throw new Error("Method not implemented.");
    }

    fetchWeightTrend(start: number, end: number): Promise<FitbitWeightTrendQueryResult> {
        throw new Error("Method not implemented.");
    }

    fetchWeightLogs(start: number, end: number): Promise<FitbitWeightQueryResult> {
        throw new Error("Method not implemented.");
    }

    fetchSleepLogs(start: number, end: number): Promise<FitbitSleepQueryResult> {
        throw new Error("Method not implemented.");
    }

    fetchIntradayStepCount(date: number): Promise<FitbitIntradayStepDayQueryResult> {
        throw new Error("Method not implemented.");
    }
    
    fetchIntradayHeartRate(date: number): Promise<FitbitHeartRateIntraDayQueryResult> {
        throw new Error("Method not implemented.");
    }


}