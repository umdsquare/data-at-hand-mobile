import { StepCountIntraDayData, IIntraDayStepCountLog } from "../../../core/exploration/data/types";
import { FitbitIntraDayMeasure } from "./FitbitIntraDayMeasure";
import { makeFitbitIntradayActivityApiUrl } from "./api";
import { FitbitIntradayStepDayQueryResult } from "./types";
import * as d3Array from 'd3-array';
import { DateTimeHelper, pad } from "../../../time";
import { FitbitLocalTableName } from "./sqlite/database";

export class FitbitIntraDayStepMeasure extends FitbitIntraDayMeasure<StepCountIntraDayData>{
    key: string = "intraday_step"

    protected async fetchAndCacheFitbitData(date: number): Promise<void> {
        const data: FitbitIntradayStepDayQueryResult = await this.service.fetchFitbitQuery(makeFitbitIntradayActivityApiUrl("activities/steps", date))

        //bin the data into one hour
        const grouped = Array.from(d3Array.group(data["activities-steps-intraday"].dataset, entry => Number.parseInt(entry.time.split(":")[0])))

        const hourlyEntries: Array<IIntraDayStepCountLog> = grouped.map(group => ({
            hourOfDay: group[0],
            value: d3Array.sum(group[1], e => e.value)
        }))

        await this.service.fitbitLocalDbManager.insert(FitbitLocalTableName.StepCountIntraDay,
            [{
                numberedDate: date,
                hourlySteps: JSON.stringify(hourlyEntries)
            }])
    }

    protected async fetchLocalData(date: number): Promise<StepCountIntraDayData> {
        const list = await this.service.fitbitLocalDbManager.fetchData<StepCountIntraDayData>(FitbitLocalTableName.StepCountIntraDay, "`numberedDate` = ?", [date])
        if (list.length > 0) {
            const result = list[0]
            result.hourlySteps = JSON.parse(result.hourlySteps as any)
            return result
        }
        else return null
    }


}