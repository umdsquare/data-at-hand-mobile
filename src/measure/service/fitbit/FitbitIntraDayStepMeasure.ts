import { StepCountIntraDayData, IIntraDayStepCountLog } from "@core/exploration/data/types";
import { FitbitIntraDayMeasure } from "./FitbitIntraDayMeasure";
import { FitbitIntradayStepDayQueryResult } from "./types";
import * as d3Array from 'd3-array';
import { FitbitLocalTableName } from "./sqlite/database";

export class FitbitIntraDayStepMeasure extends FitbitIntraDayMeasure<StepCountIntraDayData>{
    key: string = "intraday_step"

    protected async fetchAndCacheFitbitData(date: number): Promise<void> {

        //first, check whether the day summary data exists.
        const total = await this.service.core.fitbitLocalDbManager.selectQuery<{ value: number }>(`SELECT value FROM ${FitbitLocalTableName.StepCount} WHERE numberedDate = ${date}`)
        if (total != null && total.length > 0 && total[0].value > 0) {

            const data: FitbitIntradayStepDayQueryResult = await this.service.core.fetchIntradayStepCount(date)

            //bin the data into one hour
            const grouped = Array.from(d3Array.group(data["activities-steps-intraday"].dataset, entry => Number.parseInt(entry.time.split(":")[0])))

            const hourlyEntries: Array<IIntraDayStepCountLog> = grouped.map(group => ({
                hourOfDay: group[0],
                value: d3Array.sum(group[1], e => e.value)
            })).filter(entry => entry.value > 0)

            if (hourlyEntries.length > 0) {

                await this.service.core.fitbitLocalDbManager.insert(FitbitLocalTableName.StepCountIntraDay,
                    [{
                        numberedDate: date,
                        hourlySteps: JSON.stringify(hourlyEntries)
                    }])
            } else return
        } else return
    }

    protected async fetchLocalData(date: number): Promise<StepCountIntraDayData> {
        const list = await this.service.core.fitbitLocalDbManager.fetchData<StepCountIntraDayData>(FitbitLocalTableName.StepCountIntraDay, "`numberedDate` = ?", [date])
        if (list.length > 0) {
            const result = list[0]
            result.hourlySteps = JSON.parse(result.hourlySteps as any)
            return result
        }
        else return null
    }


}