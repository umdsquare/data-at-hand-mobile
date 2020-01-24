const dailySummaryProperties = {
  numberedDate: {type: 'int'},
  year: {type: 'int'},
  month: {type: 'int'},
  dayOfWeek: {type: 'int'},
};

interface IDailySummaryEntry<T> {
  numberedDate: number;
  year: number;
  month: number;
  dayOfWeek: number;
}

export interface IDataEntry<T> {
  toJson(): T;
}

interface IDailyNumericSummaryEntry
  extends IDailySummaryEntry<IDailyNumericSummaryEntry> {
  value: number;
}

export class DailyStepCountEntry
  implements IDailyNumericSummaryEntry, IDataEntry<IDailyNumericSummaryEntry> {
  public static schema = {
    name: 'DailyStepCount',
    primaryKey: 'numberedDate',
    properties: {
      ...dailySummaryProperties,
      value: {type: 'int', indexed: true},
    },
  };

  value: number;
  numberedDate: number;
  year: number;
  month: number;
  dayOfWeek: number;

  toJson(): IDailyNumericSummaryEntry {
    return {
      value: this.value,
      numberedDate: this.numberedDate,
      year: this.year,
      month: this.month,
      dayOfWeek: this.dayOfWeek,
    };
  }
}

export class RestingHeartRateEntry
  implements IDailyNumericSummaryEntry, IDataEntry<IDailyNumericSummaryEntry> {
  public static schema = {
    name: 'RestingHeartRate',
    primaryKey: 'numberedDate',
    properties: {
      ...dailySummaryProperties,
      value: {type: 'int', indexed: true},
    },
  };

  value: number;
  numberedDate: number;
  year: number;
  month: number;
  dayOfWeek: number;

  toJson(): IDailyNumericSummaryEntry {
    return {
      value: this.value,
      numberedDate: this.numberedDate,
      year: this.year,
      month: this.month,
      dayOfWeek: this.dayOfWeek,
    };
  }
}

//==========================================================

export interface ICachedRangeEntry {
  measureKey: string;
  endDate?: number;
  queriedAt?: Date;
}

export class CachedRangeEntry
  implements ICachedRangeEntry, IDataEntry<ICachedRangeEntry> {
  public static schema = {
    name: 'CachedRange',
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

//=======================================================

export const FitbitLocalCacheConfig = {
  path: 'fitbit.realm',
  deleteRealmIfMigrationNeeded: __DEV__ != null,
  schema: [CachedRangeEntry, DailyStepCountEntry, RestingHeartRateEntry],
};
