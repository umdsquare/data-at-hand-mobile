import { FitbitDailyActivityStepsQueryResult } from "./types";
import { IDatumBase } from '../../../database/types';
import { DateTimeHelper } from '../../../time';
import { DailyStepCountEntry } from './realm/schema';
import { FitbitServiceMeasure } from './FitbitServiceMeasure';
import { toDate, parse, getDay } from 'date-fns';
import { makeFitbitDayLevelActivityLogsUrl, FITBIT_DATE_FORMAT } from "./api";


export class FitbitDailyStepMeasure extends FitbitServiceMeasure {


  async cacheServerData(startDate: number, endDate: number): Promise<{ success: boolean; }> {
    console.log("Load Fitbit Step data from ", startDate, "to", endDate)
    const benchMarkStart = Date.now()
    const chunks = DateTimeHelper.splitRange(startDate, endDate, 1095)

    const queryResult: Array<FitbitDailyActivityStepsQueryResult> = await Promise.all(
      chunks.map(chunk => this.service.fetchFitbitQuery(makeFitbitDayLevelActivityLogsUrl("activities/steps", chunk[0], chunk[1])))) 

    const result = {"activities-steps":[].concat.apply([], queryResult.map(r => r["activities-steps"]))}

    console.log("Finished Loading Step data - ", result["activities-steps"].length, 'rows. Took', Date.now() - benchMarkStart, 'millis.')

    const now = new Date()
    const today = DateTimeHelper.toNumberedDateFromDate(now)

    await this.useRealm((realm) => {
      realm.write(()=>{
        result["activities-steps"].forEach(entry => {
          const numberedDate = DateTimeHelper.fromFormattedString(entry.dateTime)
          const date = parse(entry.dateTime, FITBIT_DATE_FORMAT, now)

          realm.create(DailyStepCountEntry, {
            value: Number.parseInt(entry.value),
            numberedDate,
            year: DateTimeHelper.getYear(numberedDate),
            month: DateTimeHelper.getMonth(numberedDate),
            dayOfWeek: getDay(date)
          } as DailyStepCountEntry, true)
        })
      })
    })

    console.log("Finish storing data into Realm.")

    return {success: true}
  }
  
  async fetchData(startDate: Date, endDate: Date): Promise<IDatumBase[]> {

    const result = await this.useRealmAndGet<IDatumBase[]>((realm)=>{
      const steps = realm.objects<DailyStepCountEntry>(DailyStepCountEntry)
      const filtered = steps.filtered("numberedDate >= " + DateTimeHelper.toNumberedDateFromDate(startDate) + " AND numberedDate <= " + DateTimeHelper.toNumberedDateFromDate(endDate))
      return filtered.snapshot().map(v => ({
        value: v.value,
        numberedDate: v.numberedDate
      })) as any
    })

    return result
  }
}
