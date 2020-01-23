import { FitbitDailyActivityStepsQueryResult } from "./types";
import { IDatumBase } from '../../../database/types';
import { DateTimeHelper } from '../../../time';
import { DailyStepCountEntry, CachedRangeEntry, ICachedRangeEntry } from './realm/schema';
import { FitbitServiceMeasure } from './FitbitServiceMeasure';
import { toDate, parse, getDay, differenceInMinutes } from 'date-fns';
import { makeFitbitDayLevelActivityLogsUrl, FITBIT_DATE_FORMAT } from "./api";


export class FitbitDailyStepMeasure extends FitbitServiceMeasure {

  key = 'daily_step'

  async cacheServerData(endDate: number): Promise<{ success: boolean; skipped?: boolean }> {

    const cachedRange = await this.useRealmAndGet((realm)=>{
      const rangeEntryResult = realm.objects<CachedRangeEntry>(CachedRangeEntry).filtered('measureKey = "' + this.key + '"')
      if(rangeEntryResult.isEmpty()===true){
        return null
      }else{
        return rangeEntryResult[0].toJson()
      }
    })

    if(cachedRange){
      if(endDate < cachedRange.endDate){
        return {success: true, skipped: true}
      }else if(endDate === cachedRange.endDate){
        //if same, check how old after the last day was logged.
        const now = new Date()
        if(differenceInMinutes(now, cachedRange.queriedAt) > 15){
          await this.fetchAndCacheFitbitData(endDate, endDate)
          await this.useRealm(realm => {
            realm.write(()=>{
              realm.create(CachedRangeEntry, {measureKey: this.key, queriedAt: now} as ICachedRangeEntry, true)//only update the timestamp.
            })
          })
        }
      }else{
        const now = new Date()
        await this.fetchAndCacheFitbitData(cachedRange.endDate, endDate)
        await this.useRealm(realm => {
          realm.write(()=>{
            realm.create(CachedRangeEntry, {measureKey: this.key, endDate, queriedAt: now} as ICachedRangeEntry, true)//only update the timestamp.
          })
        })
      }
    }else{
      //cache the full region
      console.log("no cache. should cache the full region.")
      const startDate = await this.service.getMembershipStartDate()
      const queriedAt = new Date()
      await this.fetchAndCacheFitbitData(startDate, endDate)
      await this.useRealm(realm => {
        realm.write(()=>{
          realm.create(CachedRangeEntry, {measureKey: this.key, endDate, queriedAt} as ICachedRangeEntry)//only update the timestamp.
        })
      })
    }


    return {success: true}
  }

  protected async fetchAndCacheFitbitData(startDate: number, endDate: number): Promise<void>{

    console.log("Load Fitbit Step data from ", startDate, "to", endDate)
    const benchMarkStart = Date.now()
    const chunks = DateTimeHelper.splitRange(startDate, endDate, 1095)

    const queryResult: Array<FitbitDailyActivityStepsQueryResult> = await Promise.all(
      chunks.map(chunk => this.service.fetchFitbitQuery(makeFitbitDayLevelActivityLogsUrl("activities/steps", chunk[0], chunk[1])))) 

    const result = {"activities-steps":[].concat.apply([], queryResult.map(r => r["activities-steps"]))}

    console.log("Finished Loading Step data - ", result["activities-steps"].length, 'rows. Took', Date.now() - benchMarkStart, 'millis.')

    const now = new Date()

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
