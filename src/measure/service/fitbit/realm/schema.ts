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

export class CachedRangeEntry {
  public static schema = {
    name: FitbitRealmSchemaNames.CachedRange,
    primaryKey: 'id',
    properties: {
      id: 'string',
      measureKey: {type: 'string', indexed: true},
      startDate: 'int',
      endDate: 'int',
      queriedAt: 'date',
    },
  };

  public id: string;
  public measureKey: string;
  public startDate: number;
  public endDate: number;
  public queriedAt: Date;
}

export const FitbitLocalCacheConfig = {
  path: 'fitbit.realm',
  deleteRealmIfMigrationNeeded: __DEV__ != null,
  schema: [CachedRangeEntry, DailyStepCountEntry],
};
