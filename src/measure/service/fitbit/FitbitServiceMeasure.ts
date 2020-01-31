import {differenceInMinutes} from 'date-fns';
import {ICachedRangeEntry} from './sqlite/database';
import { FitbitServiceMeasureBase } from './FitbitServiceMeasureBase';

export abstract class FitbitServiceMeasure extends FitbitServiceMeasureBase {
  abstract key: string;

  protected abstract fetchAndCacheFitbitData(
    startDate: number,
    endDate: number,
  ): Promise<void>;

  async cacheServerData(
    endDate: number,
  ): Promise<{success: boolean; skipped?: boolean}> {
    const cachedRange = await this.service.fitbitLocalDbManager.getCachedRange(this.key);
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
        return {success: true, skipped: true};
      } else if (endDate === cachedRange.endDate) {
        //if same, check how old after the last day was logged.
        const now = new Date();
        if (differenceInMinutes(now, cachedRange.queriedAt) > 15) {
          console.log('Recache the recent day for ', this.key);
          await this.fetchAndCacheFitbitData(endDate, endDate);
          await this.service.fitbitLocalDbManager.upsertCachedRange({
            measureKey: this.key,
            endDate,
            queriedAt: now,
          } as ICachedRangeEntry);
        } else {
          console.log("Don't need to cache again for", this.key);
        }
      } else {
        const now = new Date();
        await this.fetchAndCacheFitbitData(cachedRange.endDate, endDate);
        await this.service.fitbitLocalDbManager.upsertCachedRange({
          measureKey: this.key,
          endDate,
          queriedAt: now,
        } as ICachedRangeEntry);
      }
    } else {
      //cache the full region
      console.log('no cache. should cache the full region.');
      const startDate = await this.service.getMembershipStartDate();
      const queriedAt = new Date();
      await this.fetchAndCacheFitbitData(startDate, endDate);
      await this.service.fitbitLocalDbManager.upsertCachedRange({
        measureKey: this.key,
        endDate,
        queriedAt,
      } as ICachedRangeEntry)
    }

    return {success: true};
  }
}
