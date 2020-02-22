import { differenceInMinutes } from 'date-fns';
import { ICachedRangeEntry } from './sqlite/database';
import { FitbitServiceMeasureBase } from './FitbitServiceMeasureBase';
import { DataSourceSpec, DataSourceCategory } from '../../DataSourceSpec'
import { BoxPlotInfo } from '../../../core/exploration/data/types';
import { AsyncStorageHelper } from '../../../system/AsyncStorageHelper';
import { DateTimeHelper } from '../../../time';

export abstract class FitbitServiceMeasure extends FitbitServiceMeasureBase {
  abstract key: string;
  abstract displayName: string;

  protected abstract fetchAndCacheFitbitData(
    startDate: number,
    endDate: number,
  ): Promise<void>;

  async cacheServerData(
    endDate: number,
  ): Promise<{ success: boolean; skipped?: boolean }> {
    const cachedRange = await this.service.core.fitbitLocalDbManager.getCachedRange(this.key);
    if (cachedRange != null) {
      console.log(
        this.key,
        'data is already cached until',
        cachedRange.endDate,
      );
    }

    if (cachedRange) {
      if (endDate < cachedRange.endDate) {
        console.log("Don't need to cache again for", this.key);
        return { success: true, skipped: true };
      } else {
        const now = this.service.core.getToday();
        if (differenceInMinutes(now, cachedRange.queriedAt) > 15) { //check with 15 minute gap
          const lastFitbitSyncTime = await this.service.getLastSyncTime()
          if ((lastFitbitSyncTime.tracker || lastFitbitSyncTime.scale || Number.MAX_SAFE_INTEGER) > cachedRange.lastFitbitSyncAt) {
            console.log("Fitbit server data was updated after the last caching.")
            const queryEndDate = DateTimeHelper.toNumberedDateFromDate(lastFitbitSyncTime.tracker || lastFitbitSyncTime.scale) || endDate

            await this.fetchAndCacheFitbitData(cachedRange.endDate, endDate);
            await this.service.core.fitbitLocalDbManager.upsertCachedRange({
              measureKey: this.key,
              endDate: queryEndDate,
              queriedAt: now,
              lastFitbitSyncAt: lastFitbitSyncTime.tracker || lastFitbitSyncTime.scale,
            } as ICachedRangeEntry);
            await this.invalidateBoxPlotInfoCache()
          } else {
            console.log("No difference in Fitbit server. Don't need to cache again for", this.key);
            return { success: true, skipped: true };
          }
        }else{
          console.log("Too early since the last check. Don't need to cache again for", this.key);
          return { success: true, skipped: true };
        }
      }
    } else {
      //cache the full region
      console.log('no cache. should cache the full region.');
      const startDate = await this.service.getMembershipStartDate();
      const lastFitbitSyncTime = await this.service.getLastSyncTime();

      const queryEndDate = DateTimeHelper.toNumberedDateFromDate(lastFitbitSyncTime.tracker || lastFitbitSyncTime.scale) || endDate

      const queriedAt = this.service.core.getToday()
      await this.fetchAndCacheFitbitData(startDate, queryEndDate);
      await this.service.core.fitbitLocalDbManager.upsertCachedRange({
        measureKey: this.key,
        endDate: queryEndDate,
        lastFitbitSyncAt: lastFitbitSyncTime.tracker || lastFitbitSyncTime.scale,
        queriedAt,
      } as ICachedRangeEntry)
      await this.invalidateBoxPlotInfoCache()
    }
    return { success: true };
  }

  private async invalidateBoxPlotInfoCache(key: string = null): Promise<void> {
    return AsyncStorageHelper.remove("fitbit:value_range:" + this.key + ":" + key)
  }

  async getBoxPlotInfoOfDataset(key: string = null): Promise<BoxPlotInfo> {
    const cacheKey = "fitbit:value_range:" + this.key + ":" + key
    const cached = await AsyncStorageHelper.getObject(cacheKey)
    if (cached) {
      return cached
    } else {
      const result = await this.getBoxPlotInfoOfDatasetFromDb(key)
      AsyncStorageHelper.set(cacheKey, result)
      return result
    }
  }

  protected abstract getBoxPlotInfoOfDatasetFromDb(key: string): Promise<BoxPlotInfo>
}
