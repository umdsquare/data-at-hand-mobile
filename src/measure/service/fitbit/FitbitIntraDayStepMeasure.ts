import { StepCountIntraDayData, IIntraDayStepCountLog } from "@core/exploration/data/types";
import { FitbitIntraDayMeasure } from "./FitbitIntraDayMeasure";
import { FitbitIntradayStepDayQueryResult } from "./types";
import * as d3Array from 'd3-array';
import { FitbitLocalTableName, INTRADAY_SEPARATOR_BETWEEN } from "./sqlite/database";
import { DateTimeHelper } from "@data-at-hand/core/utils/time";
import { getNumberSequence } from "@data-at-hand/core/utils";

const HOUR_OF_DAY_SEQUENCE = getNumberSequence(0, 23)

export class FitbitIntraDayStepMeasure extends FitbitIntraDayMeasure<StepCountIntraDayData, FitbitIntradayStepDayQueryResult>{
    displayName: string = "Step intraday"

    key: string = "intraday_step"

    protected async fetchAndCacheFitbitData(date: number): Promise<void> {

        //first, check whether the day summary data exists.
        const total = await this.core.fitbitLocalDbManager.selectQuery<{ value: number }>(`SELECT value FROM ${FitbitLocalTableName.StepCount} WHERE numberedDate = ${date}`)
        if (total != null && total.length > 0 && total[0].value > 0) {
            const data: FitbitIntradayStepDayQueryResult = await this.core.fetchIntradayStepCount(date)
            await this.storeServerDataEntry(data)
        } else return
    }

    protected async storeServerDataEntry(...dataset: FitbitIntradayStepDayQueryResult[]): Promise<number[]> {

        const dbEntries = dataset.map(data => {
            const date = DateTimeHelper.fromFormattedString(data["activities-steps"][0].dateTime)
            //bin the data into one hour
            const grouped = Array.from(d3Array.group(data["activities-steps-intraday"].dataset, entry => Number.parseInt(entry.time.split(":")[0])))

            const hourlyEntries: Array<IIntraDayStepCountLog> = grouped.map(group => ({
                hourOfDay: group[0],
                value: d3Array.sum(group[1], e => e.value)
            })).filter(entry => entry.value > 0)

            const entries = HOUR_OF_DAY_SEQUENCE.map(h => {
                const e = hourlyEntries.find(entry => entry.hourOfDay === h)
                if (e) {
                    return e.value
                } else return 0
            })

            if (hourlyEntries.length > 0) {
                return {
                    numberedDate: date,
                    hourlySteps: entries.join(INTRADAY_SEPARATOR_BETWEEN)
                }
            } else null
        }).filter(d => d != null)

        if (dbEntries.length > 0) {
            await this.core.fitbitLocalDbManager.insert(FitbitLocalTableName.StepCountIntraDay, dbEntries)
        }

        return dbEntries.map(d => d.numberedDate)
    }

    protected prefetchFunc(start: number, end: number): Promise<{ result: FitbitIntradayStepDayQueryResult[]; queriedAt: number; }> {
        return this.core.prefetchIntradayStepCount(start, end)
    }

    protected async fetchLocalData(date: number): Promise<StepCountIntraDayData> {
        const list = await this.core.fitbitLocalDbManager.fetchData<StepCountIntraDayData>(FitbitLocalTableName.StepCountIntraDay, "`numberedDate` = ?", [date])
        if (list.length > 0) {
            const result = list[0]
            result.hourlySteps = (result.hourlySteps as any as string).split(INTRADAY_SEPARATOR_BETWEEN).map((e, i) => ({ hourOfDay: i, value: Number.parseInt(e) }))
            return result
        }
        else return null
    }


}