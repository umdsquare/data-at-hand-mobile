import { FitbitIntraDayMeasure } from './FitbitIntraDayMeasure';
import { FitbitHeartRateIntraDayQueryResult } from './types';
import { FitbitLocalTableName, HeartRateIntraDayInfo } from './sqlite/database';
import { IIntraDayHeartRatePoint, HeartRateIntraDayData, HeartRateZone } from '@core/exploration/data/types';
import { DateTimeHelper } from '@data-at-hand/core/utils/time';

export class FitbitIntraDayHeartRateMeasure extends FitbitIntraDayMeasure<HeartRateIntraDayData, FitbitHeartRateIntraDayQueryResult> {
  displayName: string = "Heart rate intraday"
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
    const result: FitbitHeartRateIntraDayQueryResult = await this.core.fetchIntradayHeartRate(date);
    await this.storeServerDataEntry(result)
  }

  protected async storeServerDataEntry(...dataset: FitbitHeartRateIntraDayQueryResult[]): Promise<number[]> {
    console.log("cache:", dataset)
    const dbEntries = dataset.map(result => {
      const date = DateTimeHelper.fromFormattedString(result["activities-heart"][0].dateTime)

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

        return {
          numberedDate: date,
          restingHeartRate: result["activities-heart"][0].value.restingHeartRate,
          points: JSON.stringify(points),
          customZones: JSON.stringify(result["activities-heart"][0].value.customHeartRateZones),
          zones: JSON.stringify(result["activities-heart"][0].value.heartRateZones)
        }
      } else return null
    }).filter(d => d != null)

    if (dbEntries.length > 0) {
      await this.core.fitbitLocalDbManager.insert(FitbitLocalTableName.HeartRateIntraDayInfo, dbEntries)
    }

    return dbEntries.map(d => d.numberedDate)
  }

  protected prefetchFunc(start: number, end: number): Promise<{ result: FitbitHeartRateIntraDayQueryResult[]; queriedAt: number; }> {
    return this.core.prefetchIntradayHeartRate(start, end)
  }

  protected async fetchLocalData(date: number): Promise<HeartRateIntraDayData> {

    const summaries = await this.core.fitbitLocalDbManager.fetchData<HeartRateIntraDayInfo>(FitbitLocalTableName.HeartRateIntraDayInfo, "`numberedDate` = ?", [date])
    const summary: HeartRateIntraDayInfo = summaries.length > 0 ? summaries[0] : null

    return summary ? {
      points: summary.points ? JSON.parse(summary.points as any) : [],
      customZones: summary.customZones ? JSON.parse(summary.customZones) : [],
      zones: summary.zones ? JSON.parse(summary.zones) : [],
      restingHeartRate: summary.restingHeartRate
    } : null
  }
}
