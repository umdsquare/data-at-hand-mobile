import SQLite from 'react-native-sqlite-storage';
import {SQLiteHelper} from '../../../../database/sqlite/sqlite-helper';
import stringFormat from 'string-format';
import {CyclicTimeFrame, CycleDimension, getCycleLevelOfDimension, getTimeKeyOfDimension, getCycleTypeOfDimension} from '../../../../core/exploration/cyclic_time';
import { IIntraDayHeartRatePoint } from '../../../../core/exploration/data/types';
SQLite.DEBUG(true);
SQLite.enablePromise(true);

export interface ICachedRangeEntry {
  measureKey: string;
  endDate?: number;
  queriedAt?: Date;
}

export interface ICachedIntraDayDateEntry {
  id: string;
  measureKey: string;
  date: number;
  queriedAt: Date;
}

export interface HeartRateIntraDayInfo {
  numberedDate: number;
  restingHeartRate: number;
  customZones: string;
  zones: string;
  points: Array<IIntraDayHeartRatePoint>
}

export enum FitbitLocalTableName {
  StepCount = 'StepCount',
  SleepLog = 'SleepLog',
  RestingHeartRate = 'RestingHeartRate',
  HeartRateIntraDayInfo = 'HeartRateIntraDayInfo',

  WeightTrend = 'WeightTrend',
  WeightLog = 'WeightLog',
  CachedRange = 'CachedRange',

  CachedIntraDayDates = 'CachedIntraDayDates',

  StepCountIntraDay = 'StepCountIntraDay',
}

const groupByQueryFormat =
  'SELECT {select} FROM {fromClause} WHERE {whereClause} GROUP BY {groupBy}';

const groupSelectClauseFormat =
  'MIN({minColumnName}) as min, MAX({maxColumnName}) as max, SUM({sumColumnName}) as sum, AVG({avgColumnName}) as avg, COUNT({countColumnName}) as n';

const seasonCaseClause = "CASE \
WHEN \
    month BETWEEN 3 AND 5 THEN 0 \
WHEN month BETWEEN 6 AND 8 THEN 1 \
WHEN month BETWEEN 9 AND 11 THEN 2 \
WHEN month = 12 OR month = 1 OR month = 2 THEN 3 \
END"

const dayOfWeekCaseClause = "CASE \
WHEN \
    dayOfWeek BETWEEN 1 AND 5 THEN 0 \
WHEN dayOfWeek = 0 OR dayOfWeek = 6 THEN 1 \
END"

export function makeGroupSelectClause(
  minColumnName: string = 'value',
  maxColumnName: string = 'value',
  avgColumnName: string = 'value',
  countColumnName: string = 'value',
  sumColumnName: string = 'value',
) {
  return stringFormat(groupSelectClauseFormat, {
    minColumnName,
    maxColumnName,
    avgColumnName,
    countColumnName,
    sumColumnName,
  });
}

export function makeAggregatedQuery(
  tableName: string,
  start: number,
  end: number,
  selectColumnClause = makeGroupSelectClause(),
): string {
  return (
    'SELECT ' +
    selectColumnClause +
    ' FROM ' +
    tableName +
    ' WHERE ' +
    '`numberedDate` BETWEEN ' +
    start +
    ' AND ' +
    end
  );
}

export function makeCyclicGroupQuery(
  tableName: string,
  start: number,
  end: number,
  cycleType: CyclicTimeFrame,
  selectColumnsClause: string = makeGroupSelectClause(),
  fromClause: string = tableName,
): string {
  const base = {
    fromClause,
    groupBy: 'timeKey',
    whereClause: '`numberedDate` BETWEEN ' + start + ' AND ' + end,
  };

  switch (cycleType) {
    case CyclicTimeFrame.DayOfWeek:
      return stringFormat(groupByQueryFormat, {
        ...base,
        select: 'dayOfWeek as timeKey, ' + selectColumnsClause,
      });
    case CyclicTimeFrame.MonthOfYear:
      return stringFormat(groupByQueryFormat, {
        ...base,
        select: 'month as timeKey, ' + selectColumnsClause,
      });
    case CyclicTimeFrame.SeasonOfYear:
      return stringFormat(groupByQueryFormat, {
        ...base,
        select: seasonCaseClause + ' timeKey, ' + selectColumnsClause,
      });/*
    case CyclicTimeFrame.WeekdayWeekends:
      return stringFormat(groupByQueryFormat, {
        ...base,
        select: dayOfWeekCaseClause + ' timeKey, ' + selectColumnsClause,
      });*/
  }
}

export function makeCycleDimensionRangeQuery(
  tableName: string,
  start: number,
  end: number,
  cycleDimension: CycleDimension,
  selectColumnsClause: string = makeGroupSelectClause(),
): string {
  const cycleLevel = getCycleLevelOfDimension(cycleDimension)
  const cycleType = getCycleTypeOfDimension(cycleDimension)

  if(cycleLevel != "year"){
    throw "Cycle level should be either year."
  }else{

    const base = {
      select: cycleLevel + ' as timeKey, ' + selectColumnsClause,
      fromClause: tableName,
      groupBy: 'timeKey',
      whereClause:
        '`numberedDate` BETWEEN ' +
        start +
        ' AND ' +
        end +
        ' AND ' +
        cycleType +
        ' = ' +
        getTimeKeyOfDimension(cycleDimension),
    };

    if(cycleType == CyclicTimeFrame.SeasonOfYear){
      base.select = seasonCaseClause + ' timeKey, ' + selectColumnsClause
      base.whereClause = '`numberedDate` BETWEEN ' +
      start +
      ' AND ' +
      end +
      ' AND timeKey = ' + getTimeKeyOfDimension(cycleDimension)
    }

    return stringFormat(groupByQueryFormat, base);
  }
}

const dailySummaryProperties = {
  numberedDate: {type: SQLiteHelper.SQLiteColumnType.INTEGER, primary: true},
  year: {type: SQLiteHelper.SQLiteColumnType.INTEGER, indexed: true},
  month: {type: SQLiteHelper.SQLiteColumnType.INTEGER, indexed: true},
  dayOfWeek: {type: SQLiteHelper.SQLiteColumnType.INTEGER, indexed: true},
};

const intraDayLogProperties = {
  ...dailySummaryProperties,
  numberedDate: {type: SQLiteHelper.SQLiteColumnType.INTEGER, indexed: true},
  secondsOfDay: {type: SQLiteHelper.SQLiteColumnType.INTEGER, indexed: true},
  id: {type: SQLiteHelper.SQLiteColumnType.TEXT, primary: true},
};

const StepCountSchema = {
  name: FitbitLocalTableName.StepCount,
  columns: {
    ...dailySummaryProperties,
    value: {type: SQLiteHelper.SQLiteColumnType.INTEGER, indexed: true},
  },
} as SQLiteHelper.TableSchema;

const IntraDayStepCountSchema = {
  name: FitbitLocalTableName.StepCountIntraDay,
  columns: {
    numberedDate: {type: SQLiteHelper.SQLiteColumnType.INTEGER, primary: true},
    hourlySteps: {type: SQLiteHelper.SQLiteColumnType.TEXT},
  },
};

const RestingHeartRateSchema = {
  name: FitbitLocalTableName.RestingHeartRate,
  columns: {
    ...dailySummaryProperties,
    value: {type: SQLiteHelper.SQLiteColumnType.INTEGER, indexed: true},
  },
};

const IntraDayHeartRateInfoSchema = {
  name: FitbitLocalTableName.HeartRateIntraDayInfo,
  columns: {
    numberedDate: {type: SQLiteHelper.SQLiteColumnType.INTEGER, primary: true},
    restingHeartRate: {
      type: SQLiteHelper.SQLiteColumnType.INTEGER,
      optional: true,
    },
    points: {type: SQLiteHelper.SQLiteColumnType.TEXT},
    customZones: {type: SQLiteHelper.SQLiteColumnType.TEXT, optional: true},
    zones: {type: SQLiteHelper.SQLiteColumnType.TEXT},
  },
};

const WeightTrendSchema = {
  name: FitbitLocalTableName.WeightTrend,
  columns: {
    ...dailySummaryProperties,
    value: {type: SQLiteHelper.SQLiteColumnType.REAL, indexed: true},
  },
};

const WeightLogSchema = {
  name: FitbitLocalTableName.WeightLog,
  columns: {
    ...intraDayLogProperties,
    value: {type: SQLiteHelper.SQLiteColumnType.REAL, indexed: true},
    source: {type: SQLiteHelper.SQLiteColumnType.TEXT, optional: true},
  },
};

const MainSleepLogSchema = {
  name: FitbitLocalTableName.SleepLog,
  columns: {
    ...dailySummaryProperties,
    quality: {type: SQLiteHelper.SQLiteColumnType.INTEGER},
    lengthInSeconds: {
      type: SQLiteHelper.SQLiteColumnType.INTEGER,
      indexed: true,
    },
    stageType: {type: SQLiteHelper.SQLiteColumnType.TEXT, optional: true},
    bedTimeDiffSeconds: {type: SQLiteHelper.SQLiteColumnType.INTEGER},
    wakeTimeDiffSeconds: {type: SQLiteHelper.SQLiteColumnType.INTEGER},
    listOfLevels: {type: SQLiteHelper.SQLiteColumnType.TEXT, optional: true},
  },
};

const CachedRangeSchema = {
  name: FitbitLocalTableName.CachedRange,
  columns: {
    measureKey: {type: SQLiteHelper.SQLiteColumnType.TEXT, primary: true},
    endDate: {type: SQLiteHelper.SQLiteColumnType.INTEGER},
    queriedAt: {type: SQLiteHelper.SQLiteColumnType.TEXT},
  },
};

const CachedIntraDayDatesSchema = {
  name: FitbitLocalTableName.CachedIntraDayDates,
  columns: {
    measureKey: {type: SQLiteHelper.SQLiteColumnType.TEXT, index: true},
    date: {type: SQLiteHelper.SQLiteColumnType.INTEGER, index: true},
    queriedAt: {type: SQLiteHelper.SQLiteColumnType.TEXT},
    id: {type: SQLiteHelper.SQLiteColumnType.TEXT, primary: true},
  },
};

const schemas = [
  StepCountSchema,
  RestingHeartRateSchema,
  WeightTrendSchema,
  WeightLogSchema,
  MainSleepLogSchema,
  CachedRangeSchema,
  IntraDayStepCountSchema,
  CachedIntraDayDatesSchema,
  IntraDayHeartRateInfoSchema,
];

const dbConfig = {
  name: 'fitbit-local-cache.sqlite',
  location: 'default',
} as SQLite.DatabaseParams;

export class FitbitLocalDbManager {
  private _database: SQLite.SQLiteDatabase;

  constructor() {
    console.log('initialize Fitbit Local DB Manager');
  }

  deleteDatabase(): Promise<void> {
    return SQLite.deleteDatabase(dbConfig);
  }

  open(): Promise<SQLite.SQLiteDatabase> {
    if (this._database != null) {
      return Promise.resolve(this._database);
    } else
      return SQLite.openDatabase(dbConfig)
        .then(db => {
          this._database = db;
          return db;
        })
        .then(db => {
          return db
            .transaction(tx => {
              //initialize tables
              const queries = schemas.map(s =>
                SQLiteHelper.genCreateTableQuery(s),
              );
              for (const querySet of queries) {
                if (querySet.createQuery != null) {
                  tx.executeSql(querySet.createQuery);
                }
                if (querySet.indexQueries && querySet.indexQueries.length > 0) {
                  for (const indexQuery of querySet.indexQueries) {
                    tx.executeSql(indexQuery);
                  }
                }
              }
            })
            .then(tx => db);
        });
  }

  async close(): Promise<void> {
    if (this._database) {
      await this._database.close();
      this._database = null;
    } else return
  }

  async insert(
    tableName: FitbitLocalTableName,
    entries: Array<any>,
  ): Promise<void> {
    if (entries.length === 0) {
      return;
    }

    const columnNames = Object.keys(entries[0]);
    const columnsPhrase = '(' + columnNames.join(',') + ')';
    let valueTemplate = '(';
    for (let i = 0; i < columnNames.length; i++) {
      valueTemplate += '?';
      if (i < columnNames.length - 1) {
        valueTemplate += ',';
      }
    }
    valueTemplate += ')';

    const query =
      'INSERT OR REPLACE INTO ' +
      tableName +
      ' ' +
      columnsPhrase +
      'VALUES ' +
      valueTemplate;

    return (await this.open())
      .transaction(tx => {
        for (const entry of entries) {
          tx.executeSql(
            query,
            columnNames.map(c => entry[c]),
          );
        }
      })
      .then(tx => {});
  }

  async getCachedRange(measureKey: string): Promise<ICachedRangeEntry> {
    const query =
      'SELECT * FROM ' +
      FitbitLocalTableName.CachedRange +
      ' WHERE `measureKey` = ? LIMIT 1';
    const [result] = await (await this.open()).executeSql(query, [measureKey]);
    if (result.rows.length > 0) {
      const entry = result.rows.item(0);
      entry.queriedAt = new Date(entry.queriedAt);
      return entry;
    } else {
      return null;
    }
  }

  async upsertCachedRange(obj: ICachedRangeEntry): Promise<void> {
    if (obj.queriedAt) {
      obj.queriedAt = obj.queriedAt.toString() as any;
    }
    return this.insert(FitbitLocalTableName.CachedRange, [obj]);
  }

  async getCachedIntraDayDate(
    measureKey: string,
    date: number,
  ): Promise<ICachedIntraDayDateEntry> {
    const query =
      'SELECT * FROM ' +
      FitbitLocalTableName.CachedIntraDayDates +
      ' WHERE `measureKey` = ? AND `date` = ? LIMIT 1';
    const [result] = await (await this.open()).executeSql(query, [measureKey, date]);
    if (result.rows.length > 0) {
      const entry = result.rows.item(0);
      entry.queriedAt = new Date(entry.queriedAt);
      return entry;
    } else return null;
  }

  async upsertCachedIntraDayDate(obj: ICachedIntraDayDateEntry): Promise<void> {
    if (obj.queriedAt) {
      obj.queriedAt = obj.queriedAt.toString() as any;
    }
    return this.insert(FitbitLocalTableName.CachedIntraDayDates, [obj]);
  }

  async fetchData<T>(
    tableName: FitbitLocalTableName,
    condition: string,
    parameters: any[],
    specifyColumns?: string[],
  ): Promise<T[]> {
    const query =
      'SELECT ' +
      (specifyColumns != null ? specifyColumns.join(',') : '*') +
      ' FROM ' +
      tableName +
      ' WHERE ' +
      condition;
    try {
      const [result] = await (await this.open()).executeSql(query, parameters);
      if (result.rows.length > 0) {
        return result.rows.raw();
      } else return [];
    } catch (ex) {
      console.log(ex);
      return [];
    }
  }

  async selectQuery<T>(query: string): Promise<T[]> {
    const [result] = await (await this.open()).executeSql(query);
    return result.rows.raw();
  }

  async getAggregatedValue(
    tableName: FitbitLocalTableName,
    type: SQLiteHelper.AggregationType,
    aggregatedColumnName: string,
    condition: string,
    parameters: any[],
  ): Promise<number> {
    const query =
      'SELECT ' +
      type +
      '(' +
      aggregatedColumnName +
      ') FROM ' +
      tableName +
      ' WHERE ' +
      condition;
    const [result] = await (await this.open()).executeSql(query, parameters);
    if (result.rows.length > 0) {
      const obj = result.rows.item(0);
      return obj[Object.keys(obj)[0]];
    } else return null;
  }
}
