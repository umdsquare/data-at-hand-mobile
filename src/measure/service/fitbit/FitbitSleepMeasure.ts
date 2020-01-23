import { IDatumBase, ISleepSession } from '../../../database/types';
import { FitbitService, makeFitbitSleepApiUrl } from './FitbitService';
import { FitbitSleepQueryResult } from './types';
import { toDate } from 'date-fns-tz'
import { DataServiceMeasure } from '../DataService';

export class FitbitSleepMeasure extends DataServiceMeasure {
  async fetchData(startDate: Date, endDate: Date): Promise<IDatumBase[]> {
    const result: FitbitSleepQueryResult = await this.castedService<FitbitService>().fetchFitbitQuery(makeFitbitSleepApiUrl(startDate, endDate))
    console.log(JSON.stringify(result))
    const fitbitTimezone = await this.castedService<FitbitService>().getUserTimezone()
    return []
    /*
    return result.sleep.map(log => {
      return {
        startedAt: toDate(log.startTime,{timeZone: fitbitTimezone}),
        endedAt: toDate(log.endTime, {timeZone: fitbitTimezone}),
        duration: log.duration,
        value: log.efficiency/100,
        subjectToChange: false
      } as ISleepSession
    })*/
  }


/*
  async fetchData(start: number, end: number): Promise<IDatumBase[]> {
    const result: FitbitSleepQueryResult = await this.castedService<FitbitService>().fetchFitbitQuery(makeFitbitSleepApiUrl(start, end))
    const fitbitTimezone = await this.castedService<FitbitService>().getUserTimezone()
    return result.sleep.map(log => {
      return {
        startedAt: toDate(log.startTime,{timeZone: fitbitTimezone}),
        endedAt: toDate(log.endTime, {timeZone: fitbitTimezone}),
        duration: log.duration,
        value: log.efficiency/100,
        measureCode: this.code,
        subjectToChange: false
      } as ISleepSession
    })
  }*/
}
