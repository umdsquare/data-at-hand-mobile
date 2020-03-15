import { FitbitIntraDayMeasure } from './FitbitIntraDayMeasure';
import { FitbitHeartRateIntraDayQueryResult } from './types';
import { FitbitLocalTableName, HeartRateIntraDayInfo } from './sqlite/database';
import { IIntraDayHeartRatePoint, HeartRateIntraDayData, HeartRateZone } from '@core/exploration/data/types';

export class FitbitIntraDayHeartRateMeasure extends FitbitIntraDayMeasure<HeartRateIntraDayData> {
  key = 'intraday-heartrate';

  private convertHeartRateZone(fitbitName: string): HeartRateZone {
    switch (fitbitName.toLowerCase()) {
      case 'fat burn': return HeartRateZone.FatBurn
      case 'out of range': return HeartRateZone.OutOfRange
      case 'peak': return HeartRateZone.Peak
      case 'cardio': return HeartRateZone.Cardio
      default: return fitbitName as any
    }
  }

  protected async fetchAndCacheFitbitData(date: number): Promise<void> {
    const result: FitbitHeartRateIntraDayQueryResult = await this.service.core.fetchIntradayHeartRate(date);

    const points: Array<IIntraDayHeartRatePoint> = result[
      'activities-heart-intraday'
    ].dataset.map(entry => {
      const split = entry.time.split(':');
      const hours = Number.parseInt(split[0]);
      const minutes = Number.parseInt(split[1]);
      const seconds = Number.parseInt(split[2]);

      return {
        secondOfDay: hours * 3600 + minutes * 60 + seconds,
        value: entry.value,
      };
    });

    if (points.length > 0) {

      result["activities-heart"][0].value.heartRateZones.forEach(zone => {
        zone.name = this.convertHeartRateZone(zone.name)
      })

      result["activities-heart"][0].value.customHeartRateZones.forEach(zone => {
        zone.name = this.convertHeartRateZone(zone.name)
      })

      await this.service.core.fitbitLocalDbManager.insert(FitbitLocalTableName.HeartRateIntraDayInfo, [{
        numberedDate: date,
        restingHeartRate: result["activities-heart"][0].value.restingHeartRate,
        points: JSON.stringify(points),
        customZones: JSON.stringify(result["activities-heart"][0].value.customHeartRateZones),
        zones: JSON.stringify(result["activities-heart"][0].value.heartRateZones)
      }])
    } else return
  }

  protected async fetchLocalData(date: number): Promise<HeartRateIntraDayData> {

    const summaries = await this.service.core.fitbitLocalDbManager.fetchData<HeartRateIntraDayInfo>(FitbitLocalTableName.HeartRateIntraDayInfo, "`numberedDate` = ?", [date])
    const summary: HeartRateIntraDayInfo = summaries.length > 0 ? summaries[0] : null

    return summary ? {
      points: summary.points ? JSON.parse(summary.points as any) : [],
      customZones: summary.customZones ? JSON.parse(summary.customZones) : [],
      zones: summary.zones ? JSON.parse(summary.zones) : [],
      restingHeartRate: summary.restingHeartRate
    } : null
  }
}
