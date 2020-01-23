import {IDatumBase, IWeightPoint} from '../../../database/types';
import { FitbitService, makeFitbitWeightLogApiUrl, makeFitbitWeightTrendApiUrl } from './FitbitService';
import { FitbitWeightQueryResult } from './types';
import { toDate } from 'date-fns-tz';
import { DataServiceMeasure } from '../DataService';

export class FitbitWeightLogMeasure extends DataServiceMeasure {

  async fetchData(startDate: Date, endDate: Date): Promise<IDatumBase[]> {
    console.log("fetch weight data...")
    const result: FitbitWeightQueryResult = await this.castedService<FitbitService>().fetchFitbitQuery(makeFitbitWeightLogApiUrl(startDate, endDate))
    const timeZone = await this.castedService<FitbitService>().getUserTimezone()
    console.log(result)
    return []
  }

  /*
  async fetchData(start: number, end: number): Promise<Array<IDatumBase>> {
    const result: FitbitWeightQueryResult = await this.castedService<FitbitService>().fetchFitbitQuery(makeFitbitWeightApiUrl(start, end))
    const timeZone = await this.castedService<FitbitService>().getUserTimezone()
    return result.weight.map(weightLog => ({
      measureCode: this.code,
      value: weightLog.weight,
      measuredAt: toDate(weightLog.date + "T" + weightLog.time, {timeZone: timeZone}),
      subjectToChange: false
    } as IWeightPoint))
  }*/
}
