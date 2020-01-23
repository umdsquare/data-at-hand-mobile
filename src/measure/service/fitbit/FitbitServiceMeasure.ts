import {FitbitService} from './FitbitService';
import {FitbitLocalCacheConfig, CachedRangeEntry, ICachedRangeEntry} from './realm/schema';
import {differenceInMinutes} from 'date-fns';

function useLocalCacheRealm(usageFunc: (realm: Realm) => void): Promise<void> {
  return Realm.open(FitbitLocalCacheConfig).then(realm => {
    usageFunc(realm);
    realm.close();
  });
}

async function useLocalCacheRealmAndGet<T>(
  usageFunc: (realm: Realm) => T,
): Promise<T> {
  return Realm.open(FitbitLocalCacheConfig).then(realm => {
    const result = usageFunc(realm);
    realm.close();
    return result;
  });
}

export abstract class FitbitServiceMeasure {
  abstract key: string;

  constructor(protected readonly service: FitbitService) {}

  protected useRealm(usageFunc: (realm: Realm) => void): Promise<void> {
    return useLocalCacheRealm(usageFunc);
  }

  protected useRealmAndGet<T>(usageFunc: (realm: Realm) => T): Promise<T> {
    return useLocalCacheRealmAndGet(usageFunc);
  }

  protected abstract fetchAndCacheFitbitData(
    startDate: number,
    endDate: number,
  ): Promise<void>;

  async cacheServerData(
    endDate: number,
  ): Promise<{success: boolean; skipped?: boolean}> {
    const cachedRange = await this.useRealmAndGet(realm => {
      const rangeEntryResult = realm
        .objects<CachedRangeEntry>(CachedRangeEntry)
        .filtered('measureKey = "' + this.key + '"');
      if (rangeEntryResult.isEmpty() === true) {
        return null;
      } else {
        return rangeEntryResult[0].toJson();
      }
    });

    if (cachedRange) {
      if (endDate < cachedRange.endDate) {
        return {success: true, skipped: true};
      } else if (endDate === cachedRange.endDate) {
        //if same, check how old after the last day was logged.
        const now = new Date();
        if (differenceInMinutes(now, cachedRange.queriedAt) > 15) {
          await this.fetchAndCacheFitbitData(endDate, endDate);
          await this.useRealm(realm => {
            realm.write(() => {
              realm.create(
                CachedRangeEntry,
                {measureKey: this.key, queriedAt: now} as ICachedRangeEntry,
                true,
              );
            });
          });
        }
      } else {
        const now = new Date();
        await this.fetchAndCacheFitbitData(cachedRange.endDate, endDate);
        await this.useRealm(realm => {
          realm.write(() => {
            realm.create(
              CachedRangeEntry,
              {
                measureKey: this.key,
                endDate,
                queriedAt: now,
              } as ICachedRangeEntry,
              true,
            );
          });
        });
      }
    } else {
      //cache the full region
      console.log('no cache. should cache the full region.');
      const startDate = await this.service.getMembershipStartDate();
      const queriedAt = new Date();
      await this.fetchAndCacheFitbitData(startDate, endDate);
      await this.useRealm(realm => {
        realm.write(() => {
          realm.create(CachedRangeEntry, {
            measureKey: this.key,
            endDate,
            queriedAt,
          } as ICachedRangeEntry);
        });
      });
    }

    return {success: true};
  }
}
