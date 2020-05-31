import { FitbitIntraDayMeasure } from './FitbitIntraDayMeasure';
import { FitbitHeartRateIntraDayQueryResult } from './types';
import { FitbitLocalTableName, HeartRateIntraDayInfo, INTRADAY_SEPARATOR_WITHIN, INTRADAY_SEPARATOR_BETWEEN } from './sqlite/database';
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

        const zones = result["activities-heart"][0].value.heartRateZones

        zones.forEach(zone => {
          zone.name = this.convertHeartRateZone(zone.name)
        })

        result["activities-heart"][0].value.customHeartRateZones.forEach(zone => {
          zone.name = this.convertHeartRateZone(zone.name)
        })

        return {
          numberedDate: date,
          restingHeartRate: result["activities-heart"][0].value.restingHeartRate,
          points: points.map(p => p.secondOfDay + INTRADAY_SEPARATOR_WITHIN + p.value).join(INTRADAY_SEPARATOR_BETWEEN),
          //customZones: JSON.stringify(result["activities-heart"][0].value.customHeartRateZones),
          zones: zones.map(zone => zone.caloriesOut + INTRADAY_SEPARATOR_WITHIN
            + zone.min + INTRADAY_SEPARATOR_WITHIN
            + zone.max + INTRADAY_SEPARATOR_WITHIN
            + zone.minutes + INTRADAY_SEPARATOR_WITHIN
            + zone.name).join(INTRADAY_SEPARATOR_BETWEEN)
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
      points: summary.points ? (summary.points as any as string).split(INTRADAY_SEPARATOR_BETWEEN).map(pointString => {
        const split = pointString.split(INTRADAY_SEPARATOR_WITHIN)
        return { secondOfDay: Number.parseInt(split[0]), value: Number.parseInt(split[1]) }
      }) : [],
      customZones: summary.customZones ? JSON.parse(summary.customZones) : [],
      zones: summary.zones ? (summary.zones as any as string).split(INTRADAY_SEPARATOR_BETWEEN).map(zoneString => {
        const split = zoneString.split(INTRADAY_SEPARATOR_WITHIN)
        return {
          caloriesOut: Number.parseFloat(split[0]),
          min: Number.parseInt(split[1]),
          max: Number.parseInt(split[2]),
          minutes: Number.parseInt(split[3]),
          name: split[4] as any
        }
      }) : [],
      restingHeartRate: summary.restingHeartRate
    } : null
  }
}
