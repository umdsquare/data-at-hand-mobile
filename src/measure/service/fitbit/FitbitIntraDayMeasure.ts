import {FitbitServiceMeasureBase} from './FitbitServiceMeasureBase';
import {differenceInMinutes, endOfDay, isAfter} from 'date-fns';
import {DateTimeHelper} from '../../../time';

export abstract class FitbitIntraDayMeasure<
  DataType
> extends FitbitServiceMeasureBase {
  abstract key: string;

  async fetchData(date: number): Promise<DataType> {
    const cacheInfo = await this.service.core.fitbitLocalDbManager.getCachedIntraDayDate(
      this.key,
      date,
    );
    if (cacheInfo) {
      const now = new Date();
      const cachedDate = endOfDay(DateTimeHelper.toDate(cacheInfo.date));
      if (isAfter(cacheInfo.queriedAt, cachedDate) === true) {
        return this.fetchLocalData(date);
      } else if (differenceInMinutes(now, cacheInfo.queriedAt) < 15) {
        return this.fetchLocalData(date);
      }
    }

    //fetch Fitbit data and cache, then return
    try {
      await this.fetchAndCacheFitbitData(date);
      await this.service.core.fitbitLocalDbManager.upsertCachedIntraDayDate({
          id: this.key + "|" + date,
          measureKey: this.key,
          date: date,
          queriedAt: new Date()
      })
      return this.fetchLocalData(date);
    } catch (err) {
        console.error(err)
        return null
    }
  }

  protected abstract fetchAndCacheFitbitData(date: number): Promise<void>;

  protected abstract fetchLocalData(date: number): Promise<DataType>;
}
