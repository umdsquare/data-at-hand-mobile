import { FitbitDailyActivityStepsQueryResult } from "./types";
import { DailyStepCountEntry } from './realm/schema';
import { makeFitbitDayLevelActivityLogsUrl } from "./api";
import { FitbitSummaryLogMeasure } from "./FitbitSummaryLogMeasure";
import { StepCountRangedData } from "../../../core/exploration/data/types";
import { DataSourceType } from "../../DataSourceSpec";

export class FitbitDailyStepMeasure extends FitbitSummaryLogMeasure<FitbitDailyActivityStepsQueryResult, DailyStepCountEntry> {
  
  key = 'daily_step'

  protected realmEntryClassType: any = DailyStepCountEntry
  protected resourcePropertyKey: string = "activities-steps"
  protected makeQueryUrl(startDate: number, endDate: number): string {
    return makeFitbitDayLevelActivityLogsUrl("activities/steps", startDate, endDate)
  }

  protected getLocalRangeQueryCondition(startDate: number, endDate: number): string{
    return super.getLocalRangeQueryCondition(startDate, endDate) + ' AND value > 25'
  }

  protected getQueryResultEntryValue(queryResultEntry: any) {
    return Number.parseInt(queryResultEntry.value)
  }

  async fetchData(startDate: number, endDate: number): Promise<StepCountRangedData>{
    const rangedData = await super.fetchPreliminaryData(startDate, endDate)
    const base = {
      source: DataSourceType.StepCount,
      data: rangedData.list,
      today: this.fetchTodayValue(),
      statistics: [
        {type: 'avg', value: rangedData.avg},
        {type: 'total', value: rangedData.sum},
        {type: 'range', value: [rangedData.min, rangedData.max]}
        /*
        {label: STATISTICS_LABEL_AVERAGE + " ", valueText: commaNumber(Math.round(rangedData.avg))},
        {label: STATISTICS_LABEL_TOTAL + " ", valueText: commaNumber(rangedData.sum)},
        {label: STATISTICS_LABEL_RANGE+ " ", valueText: commaNumber(rangedData.min) + " - " + commaNumber(rangedData.max)}*/
      ]
    } as StepCountRangedData

    return base
  }
}
