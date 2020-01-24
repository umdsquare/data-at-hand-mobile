import {FitbitService} from './FitbitService';
import {
  CachedRangeEntry,
  ICachedRangeEntry,
} from './realm/schema';
import {differenceInMinutes} from 'date-fns';

export abstract class FitbitServiceMeasure {
  abstract key: string;

  constructor(protected readonly service: FitbitService) {}

  protected abstract fetchAndCacheFitbitData(
    startDate: number,
    endDate: number,
  ): Promise<void>;

  async cacheServerData(
    endDate: number,
  ): Promise<{success: boolean; skipped?: boolean}> {
    let cachedRange;
    const rangeEntryResult = this.service.realm
      .objects<CachedRangeEntry>(CachedRangeEntry)
      .filtered('measureKey = "' + this.key + '"');
    if (rangeEntryResult.isEmpty() === true) {
      console.log(this.key, 'data is not cached in the system.');
      cachedRange = null;
    } else {
      cachedRange = rangeEntryResult[0].toJson();
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
          this.service.realm.write(() => {
            this.service.realm.create(
              CachedRangeEntry,
              {measureKey: this.key, queriedAt: now} as ICachedRangeEntry,
              true,
            );
          });
        } else {
          console.log("Don't need to cache again for", this.key);
        }
      } else {
        const now = new Date();
        await this.fetchAndCacheFitbitData(cachedRange.endDate, endDate);
        this.service.realm.write(() => {
          this.service.realm.create(
            CachedRangeEntry,
            {
              measureKey: this.key,
              endDate,
              queriedAt: now,
            } as ICachedRangeEntry,
            true,
          );
        });
      }
    } else {
      //cache the full region
      console.log('no cache. should cache the full region.');
      const startDate = await this.service.getMembershipStartDate();
      const queriedAt = new Date();
      await this.fetchAndCacheFitbitData(startDate, endDate);
      this.service.realm.write(() => {
        this.service.realm.create(CachedRangeEntry, {
          measureKey: this.key,
          endDate,
          queriedAt,
        } as ICachedRangeEntry);
      });
    }

    return {success: true};
  }
}
