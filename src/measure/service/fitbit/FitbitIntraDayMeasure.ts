import { FitbitServiceMeasureBase } from './FitbitServiceMeasureBase';
import { differenceInMinutes, endOfDay, isAfter } from 'date-fns';
import { DateTimeHelper } from '@data-at-hand/core/utils/time';

export abstract class FitbitIntraDayMeasure<
  DataType, ServerResultType
  > extends FitbitServiceMeasureBase {
  abstract key: string;

  async fetchData(date: number): Promise<DataType> {
    const cacheInfo = await this.core.fitbitLocalDbManager.getCachedIntraDayDate(
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
      await this.core.fitbitLocalDbManager.upsertCachedIntraDayDate({
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

  protected abstract storeServerDataEntry(...dataset: ServerResultType[]): Promise<number[]>;

  async cacheServerData(until: number): Promise<{ success: boolean, skipped?: boolean }> {
    if (this.core.isPrefetchAvailable() === true) {
      const recentPrefetched = await this.core.fitbitLocalDbManager.getLatestCachedIntraDayDate(this.key)
      const start = Math.max(await this.core.getMembershipStartDate(), recentPrefetched != null ? recentPrefetched.date : Number.MIN_SAFE_INTEGER)
      if (start <= until) {
        const chunks = DateTimeHelper.splitRange(start, until, 365);
        if (chunks.length > 0) {
          await Promise.all(chunks.map(async chunk => {
            console.log(`fetch intraday ${this.key} from ${chunk[0]} to ${chunk[1]}...`)
            const fetchedData = await this.prefetchFunc(chunk[0], chunk[1])
            if (fetchedData != null) {
              const cachedDates = await this.storeServerDataEntry(...fetchedData.result)
              const queriedAt = new Date(fetchedData.queriedAt)
              await this.core.fitbitLocalDbManager.upsertCachedIntraDayDate(...cachedDates.map(date => ({
                id: this.key + "|" + date,
                measureKey: this.key,
                date,
                queriedAt
              })))
            }
          }))
          return { success: true, skipped: false }
        } else {
          return { success: true, skipped: true }
        }
      }
      else return { success: true, skipped: true }
    } else return {
      success: true, skipped: true
    }
  }

  protected abstract prefetchFunc(start: number, end: number): Promise<{ result: ServerResultType[], queriedAt: number }>

  protected abstract fetchAndCacheFitbitData(date: number): Promise<void>;

  protected abstract fetchLocalData(date: number): Promise<DataType>;
}
