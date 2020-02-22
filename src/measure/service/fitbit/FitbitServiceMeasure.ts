import { differenceInMinutes } from 'date-fns';
import { ICachedRangeEntry } from './sqlite/database';
import { FitbitServiceMeasureBase } from './FitbitServiceMeasureBase';
import { DataSourceSpec, DataSourceCategory } from '../../DataSourceSpec'
import { BoxPlotInfo } from '../../../core/exploration/data/types';
import { AsyncStorageHelper } from '../../../system/AsyncStorageHelper';

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
      } else if (endDate === cachedRange.endDate) {
        //if same, check how old after the last day was logged.
        const now = this.service.core.getToday()
        if (differenceInMinutes(now, cachedRange.queriedAt) > 15) {
          console.log('Recache the recent day for ', this.key);
          await this.fetchAndCacheFitbitData(endDate, endDate);
          await this.service.core.fitbitLocalDbManager.upsertCachedRange({
            measureKey: this.key,
            endDate,
            queriedAt: now,
          } as ICachedRangeEntry);
          await this.invalidateBoxPlotInfoCache()
        } else {
          console.log("Don't need to cache again for", this.key);
        }
      } else {
        const now = this.service.core.getToday();
        await this.fetchAndCacheFitbitData(cachedRange.endDate, endDate);
        await this.service.core.fitbitLocalDbManager.upsertCachedRange({
          measureKey: this.key,
          endDate,
          queriedAt: now,
        } as ICachedRangeEntry);

        await this.invalidateBoxPlotInfoCache()
      }
    } else {
      //cache the full region
      console.log('no cache. should cache the full region.');
      const startDate = await this.service.getMembershipStartDate();
      const queriedAt = this.service.core.getToday()
      await this.fetchAndCacheFitbitData(startDate, endDate);
      await this.service.core.fitbitLocalDbManager.upsertCachedRange({
        measureKey: this.key,
        endDate,
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
