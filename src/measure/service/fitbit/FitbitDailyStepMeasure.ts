import { FitbitDailyActivityStepsQueryResult } from "./types";
import { FitbitSummaryLogMeasure } from "./FitbitSummaryLogMeasure";
import { StepCountRangedData } from "../../../core/exploration/data/types";
import { DataSourceType } from "../../DataSourceSpec";
import { FitbitLocalTableName } from "./sqlite/database";

export class FitbitDailyStepMeasure extends FitbitSummaryLogMeasure<FitbitDailyActivityStepsQueryResult> {
  
  protected dbTableName = FitbitLocalTableName.StepCount;
  
  key = 'daily_step'
  displayName = "Step Count"

  protected resourcePropertyKey: string = "activities-steps"

  protected queryFunc(startDate: number, endDate: number): Promise<FitbitDailyActivityStepsQueryResult> {
    return this.service.core.fetchStepDailySummary(startDate, endDate)
  }

  protected shouldReject(rowValue: number): boolean {
    return rowValue === 0
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
      range: [startDate, endDate],
      today: await this.fetchTodayValue(),
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
