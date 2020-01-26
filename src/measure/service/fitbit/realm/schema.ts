import { IDailySummaryEntry, IIntraDayLogEntry, IDailyNumericSummaryEntry, IDailySleepSummaryEntry } from "../../../../core/exploration/data/types";

const dailySummaryProperties = {
  numberedDate: {type: 'int'},
  year: {type: 'int', indexed: true},
  month: {type: 'int', indexed: true},
  dayOfWeek: {type: 'int', indexed: true},
};

export interface IDataEntry<T> {
  toJson(): T;
}

const intraDayLogProperties = {
  ...dailySummaryProperties,
  numberedDate: {type: 'int', indexed: true},
  secondsOfDay: {type: 'int', indexed: true},
  id: 'string',
};

export interface IWeightIntraDayLogEntry extends IIntraDayLogEntry {
  value: number;
  source: string;
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

export class DailyWeightTrendEntry
  implements IDailyNumericSummaryEntry, IDataEntry<IDailyNumericSummaryEntry> {
  public static schema = {
    name: 'DailyWeightTrendEntry',
    primaryKey: 'numberedDate',
    properties: {
      ...dailySummaryProperties,
      value: {type: 'float'}, // float cannot be indexed
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

export class WeightIntraDayLogEntry
  implements IWeightIntraDayLogEntry, IDataEntry<IWeightIntraDayLogEntry> {
  public static schema = {
    name: 'WeightIntraDayLogEntry',
    primaryKey: 'id',
    properties: {
      ...intraDayLogProperties,
      value: 'float',
      source: 'string?',
    },
  };

  value: number;
  source: string;
  secondsOfDay: number;
  numberedDate: number;
  year: number;
  month: number;
  dayOfWeek: number;

  toJson(): IWeightIntraDayLogEntry {
    return {
      value: this.value,
      source: this.source,
      secondsOfDay: this.secondsOfDay,
      numberedDate: this.numberedDate,
      year: this.year,
      month: this.month,
      dayOfWeek: this.dayOfWeek,
    };
  }
}

export class DailyMainSleepEntry implements IDailySleepSummaryEntry{

    public static schema = {
        name: "DailyMainSleepEntry",
        primaryKey: "numberedDate",
        properties: {
            ...dailySummaryProperties,
            quality: 'int',
            lengthInSeconds: 'int',
            bedTimeDiffSeconds: 'int',
            wakeTimeDiffSeconds: 'int',
            listOfLevels: 'string[]'
        }
    }

    quality: number;
    lengthInSeconds: number;
    bedTimeDiffSeconds: number;
    wakeTimeDiffSeconds: number;
    numberedDate: number;
    year: number;
    month: number;
    dayOfWeek: number;
    listOfLevels: string[];

    toJson(includeLevels: boolean): IDailySleepSummaryEntry{
        return {
            quality: this.quality,
            lengthInSeconds: this.lengthInSeconds,
            bedTimeDiffSeconds: this.bedTimeDiffSeconds,
            wakeTimeDiffSeconds: this.wakeTimeDiffSeconds,
            numberedDate: this.numberedDate,
            year: this.year,
            month: this.month,
            dayOfWeek: this.dayOfWeek,
        }

        //TODO consider levels for the day-level view
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
  schema: [
    CachedRangeEntry,
    DailyStepCountEntry,
    RestingHeartRateEntry,
    DailyWeightTrendEntry,
    WeightIntraDayLogEntry,
    DailyMainSleepEntry
  ],
};
