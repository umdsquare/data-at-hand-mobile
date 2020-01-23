enum FitbitRealmSchemaNames {
  CachedRange = 'CachedRange',
  DailyStepCount = 'DailyStepCount',
}

const dailySummaryProperties = {
  numberedDate: {type: 'int'},
  year: {type: 'int'},
  month: {type: 'int'},
  dayOfWeek: {type: 'int'},
};

class DailySummaryEntry {
  numberedDate: number;
  year: number;
  month: number;
  dayOfWeek: number;
}

export class DailyStepCountEntry extends DailySummaryEntry {
  public static schema = {
    name: FitbitRealmSchemaNames.DailyStepCount,
    primaryKey: 'numberedDate',
    properties: {
      ...dailySummaryProperties,
      value: {type: 'int', indexed: true},
    },
  };

  public value: number;
}

export interface ICachedRangeEntry{
  measureKey: string;
  endDate?: number;
  queriedAt?: Date;
}

export class CachedRangeEntry implements ICachedRangeEntry {
  public static schema = {
    name: FitbitRealmSchemaNames.CachedRange,
    primaryKey: 'measureKey',
    properties: {
      measureKey: 'string',
      endDate: 'int',
      queriedAt: 'date',
    },
  };

  public measureKey: string;
  public endDate: number;
  public queriedAt: Date;

  toJson(): ICachedRangeEntry {
    return {
      measureKey: this.measureKey,
      endDate: this.endDate,
      queriedAt: this.queriedAt,
    };
  }
}

export const FitbitLocalCacheConfig = {
  path: 'fitbit.realm',
  deleteRealmIfMigrationNeeded: __DEV__ != null,
  schema: [CachedRangeEntry, DailyStepCountEntry],
};
