import { FitbitDailyActivityStepsQueryResult } from "./types";
import { DailyStepCountEntry } from './realm/schema';
import { makeFitbitDayLevelActivityLogsUrl } from "./api";
import { FitbitSummaryLogMeasure } from "./FitbitSummaryLogMeasure";


export class FitbitDailyStepMeasure extends FitbitSummaryLogMeasure<FitbitDailyActivityStepsQueryResult, DailyStepCountEntry> {
  
  protected realmEntryClassType: any = DailyStepCountEntry
  protected resourcePropertyKey: string = "activities-steps"
  protected makeQueryUrl(startDate: number, endDate: number): string {
    return makeFitbitDayLevelActivityLogsUrl("activities/steps", startDate, endDate)
  }

  protected getQueryResultEntryValue(queryResultEntry: any) {
    return Number.parseInt(queryResultEntry.value)
  }

  key = 'daily_step'
}
