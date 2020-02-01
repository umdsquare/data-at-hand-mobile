import {FitbitIntraDayMeasure} from './FitbitIntraDayMeasure';
import {makeFitbitHeartRateIntraDayLogApiUrl} from './api';
import {FitbitHeartRateIntraDayQueryResult} from './types';
import {FitbitLocalTableName, HeartRateIntraDayInfo} from './sqlite/database';
import {IIntraDayHeartRatePoint, HeartRateIntraDayData, HeartRateZone} from '../../../core/exploration/data/types';
import {DateTimeHelper} from '../../../time';

export class FitbitIntraDayHeartRateMeasure extends FitbitIntraDayMeasure<HeartRateIntraDayData> {
  key = 'intraday-heartrate';

  private convertHeartRateZone(fitbitName:string): HeartRateZone{
      switch(fitbitName.toLowerCase()){
          case 'fat burn': return HeartRateZone.FatBurn
          case 'out of range': return HeartRateZone.OutOfRange
          case 'peak': return HeartRateZone.Peak
          case 'cardio': return HeartRateZone.Cardio
          default: return fitbitName as any
      }
  }

  protected async fetchAndCacheFitbitData(date: number): Promise<void> {
    const result: FitbitHeartRateIntraDayQueryResult = await this.service.fetchFitbitQuery(
      makeFitbitHeartRateIntraDayLogApiUrl(date),
    );

    const points: Array<IIntraDayHeartRatePoint> = result[
      'activities-heart-intraday'
    ].dataset.map(entry => {
      const split = entry.time.split(':');
      const hours = Number.parseInt(split[0]);
      const minutes = Number.parseInt(split[1]);
      const seconds = Number.parseInt(split[2]);

      return {
        id: DateTimeHelper.toFormattedString(date) + 'T' + entry.time,
        numberedDate: date,
        secondOfDay: hours * 3600 + minutes * 60 + seconds,
        value: entry.value,
      };
    });

    result["activities-heart"][0].value.heartRateZones.forEach(zone => {
        zone.name = this.convertHeartRateZone(zone.name)
    })

    result["activities-heart"][0].value.customHeartRateZones.forEach(zone => {
        zone.name = this.convertHeartRateZone(zone.name)
    })


    await this.service.fitbitLocalDbManager.insert(FitbitLocalTableName.HeartRateIntraDayPoints, points);

    await this.service.fitbitLocalDbManager.insert(FitbitLocalTableName.HeartRateIntraDayInfo, [{
        numberedDate: date,
        restingHeartRate: result["activities-heart"][0].value.restingHeartRate,
        customZones: JSON.stringify(result["activities-heart"][0].value.customHeartRateZones),
        zones: JSON.stringify(result["activities-heart"][0].value.heartRateZones)
    } as HeartRateIntraDayInfo])
  }
  
  protected async fetchLocalData(date: number): Promise<HeartRateIntraDayData> {

    const points = await this.service.fitbitLocalDbManager.fetchData<IIntraDayHeartRatePoint>(FitbitLocalTableName.HeartRateIntraDayPoints, "`numberedDate` = ?", [date])
    const summaries = await this.service.fitbitLocalDbManager.fetchData<HeartRateIntraDayInfo>(FitbitLocalTableName.HeartRateIntraDayInfo, "`numberedDate` = ?", [date])
    const summary: HeartRateIntraDayInfo = summaries.length > 0 ? summaries[0] : null

    return {
        points,
        customZones: summary ? JSON.parse(summary.customZones) : [],
        zones: summary ? JSON.parse(summary.zones): [],
        restingHeartRate: summary ? summary.restingHeartRate : -1
    }
  }
}
