import SQLite, { DatabaseParams } from 'react-native-sqlite-storage';
import { SQLiteHelper } from '../../../../database/sqlite/sqlite-helper';
import stringFormat from 'string-format';
import { CyclicTimeFrame, CycleDimension, getCycleLevelOfDimension, getTimeKeyOfDimension, getCycleTypeOfDimension } from '../../../../core/exploration/cyclic_time';
import { IIntraDayHeartRatePoint, BoxPlotInfo } from '../../../../core/exploration/data/types';
import Papa from 'papaparse';
import { DateTimeHelper } from '../../../../time';
import merge from 'merge';

SQLite.DEBUG(false);
SQLite.enablePromise(true);

export interface ICachedRangeEntry {
  measureKey: string;
  endDate?: number;
  lastFitbitSyncAt?: Date;
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

  CachedDataSourceSummary = "CachedDataSourceSummary",

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

  if (cycleLevel != "year") {
    throw "Cycle level should be either year."
  } else {

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

    if (cycleType == CyclicTimeFrame.SeasonOfYear) {
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
  numberedDate: { type: SQLiteHelper.SQLiteColumnType.INTEGER, primary: true },
  year: { type: SQLiteHelper.SQLiteColumnType.INTEGER, indexed: true },
  month: { type: SQLiteHelper.SQLiteColumnType.INTEGER, indexed: true },
  dayOfWeek: { type: SQLiteHelper.SQLiteColumnType.INTEGER, indexed: true },
};

const intraDayLogProperties = {
  ...dailySummaryProperties,
  numberedDate: { type: SQLiteHelper.SQLiteColumnType.INTEGER, indexed: true },
  secondsOfDay: { type: SQLiteHelper.SQLiteColumnType.INTEGER, indexed: true },
  id: { type: SQLiteHelper.SQLiteColumnType.TEXT, primary: true },
};

const StepCountSchema = {
  name: FitbitLocalTableName.StepCount,
  columns: {
    ...dailySummaryProperties,
    value: { type: SQLiteHelper.SQLiteColumnType.INTEGER, indexed: true },
  },
} as SQLiteHelper.TableSchema;

const IntraDayStepCountSchema = {
  name: FitbitLocalTableName.StepCountIntraDay,
  columns: {
    numberedDate: { type: SQLiteHelper.SQLiteColumnType.INTEGER, primary: true },
    hourlySteps: { type: SQLiteHelper.SQLiteColumnType.TEXT },
  },
};

const RestingHeartRateSchema = {
  name: FitbitLocalTableName.RestingHeartRate,
  columns: {
    ...dailySummaryProperties,
    value: { type: SQLiteHelper.SQLiteColumnType.INTEGER, indexed: true },
  },
};

const IntraDayHeartRateInfoSchema = {
  name: FitbitLocalTableName.HeartRateIntraDayInfo,
  columns: {
    numberedDate: { type: SQLiteHelper.SQLiteColumnType.INTEGER, primary: true },
    restingHeartRate: {
      type: SQLiteHelper.SQLiteColumnType.INTEGER,
      optional: true,
    },
    points: { type: SQLiteHelper.SQLiteColumnType.TEXT },
    customZones: { type: SQLiteHelper.SQLiteColumnType.TEXT, optional: true },
    zones: { type: SQLiteHelper.SQLiteColumnType.TEXT },
  },
};

const WeightTrendSchema = {
  name: FitbitLocalTableName.WeightTrend,
  columns: {
    ...dailySummaryProperties,
    value: { type: SQLiteHelper.SQLiteColumnType.REAL, indexed: true },
  },
};

const WeightLogSchema = {
  name: FitbitLocalTableName.WeightLog,
  columns: {
    ...intraDayLogProperties,
    value: { type: SQLiteHelper.SQLiteColumnType.REAL, indexed: true },
    source: { type: SQLiteHelper.SQLiteColumnType.TEXT, optional: true },
  },
};

const MainSleepLogSchema = {
  name: FitbitLocalTableName.SleepLog,
  columns: {
    ...dailySummaryProperties,
    quality: { type: SQLiteHelper.SQLiteColumnType.INTEGER },
    lengthInSeconds: {
      type: SQLiteHelper.SQLiteColumnType.INTEGER,
      indexed: true,
    },
    stageType: { type: SQLiteHelper.SQLiteColumnType.TEXT, optional: true },
    bedTimeDiffSeconds: { type: SQLiteHelper.SQLiteColumnType.INTEGER },
    wakeTimeDiffSeconds: { type: SQLiteHelper.SQLiteColumnType.INTEGER },
    listOfLevels: { type: SQLiteHelper.SQLiteColumnType.TEXT, optional: true },
  },
};

const CachedRangeSchema = {
  name: FitbitLocalTableName.CachedRange,
  columns: {
    measureKey: { type: SQLiteHelper.SQLiteColumnType.TEXT, primary: true },
    endDate: { type: SQLiteHelper.SQLiteColumnType.INTEGER },
    lastFitbitSyncAt: { type: SQLiteHelper.SQLiteColumnType.TEXT },
    queriedAt: { type: SQLiteHelper.SQLiteColumnType.TEXT },
  },
};

const CachedIntraDayDatesSchema = {
  name: FitbitLocalTableName.CachedIntraDayDates,
  columns: {
    measureKey: { type: SQLiteHelper.SQLiteColumnType.TEXT, index: true },
    date: { type: SQLiteHelper.SQLiteColumnType.INTEGER, index: true },
    queriedAt: { type: SQLiteHelper.SQLiteColumnType.TEXT },
    id: { type: SQLiteHelper.SQLiteColumnType.TEXT, primary: true },
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

export class FitbitLocalDbManager {
  private _dbInitPromise: Promise<SQLite.SQLiteDatabase>

  private readonly _dbConfig: DatabaseParams

  constructor(dbConfig: DatabaseParams) {
    this._dbConfig = dbConfig
    console.log('initialize Fitbit Local DB Manager');
  }

  async deleteDatabase(): Promise<void> {
    try {
      if (this._dbInitPromise != null) {
        await this._dbInitPromise

      }
      await SQLite.deleteDatabase({ ...this._dbConfig });
      this._dbInitPromise = null
    } catch (e) {
      this._dbInitPromise = null
      return
    }
  }

  open(): Promise<SQLite.SQLiteDatabase> {
    if (this._dbInitPromise) {
      return this._dbInitPromise
    }

    console.log("try open the database:", this._dbConfig)

    this._dbInitPromise = SQLite.openDatabase({...this._dbConfig})
      .then(db => {
        console.log("db opened.")
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
          }).then(tx => db)
      })

    return this._dbInitPromise
  }

  async close(): Promise<void> {
    if (this._dbInitPromise) {
      (await this._dbInitPromise).close();
      this._dbInitPromise = null
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
      .then(tx => { });
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
      entry.lastFitbitSyncAt = new Date(entry.lastFitbitSyncAt)
      return entry;
    } else {
      return null;
    }
  }

  async upsertCachedRange(obj: ICachedRangeEntry): Promise<void> {
    if (obj.queriedAt) {
      obj.queriedAt = obj.queriedAt.toString() as any;
    }
    if (obj.lastFitbitSyncAt) {
      obj.lastFitbitSyncAt = obj.lastFitbitSyncAt.toString() as any;
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

  async findPercentileValue(ratio: number, tableName: string, valueColumnName: string = 'value'): Promise<number> {
    const query = `SELECT ${valueColumnName} as value FROM ${tableName} ORDER BY value ASC\
    LIMIT 1\
    OFFSET ROUND((SELECT COUNT(*) FROM ${tableName}) * ${ratio.toFixed(2)}) - 1\
    `

    const result = await this.selectQuery<any>(query)
    if (result.length > 0) {
      return result[0].value
    } else return null
  }

  async findValueClosestTo(closestTo: number, tableName: string, side: 'smaller' | 'larger' | 'closest' = 'closest', valueColumnName: string = 'value'): Promise<number> {
    let whereClause = null
    switch (side) {
      case 'closest':
        break;
      case 'smaller':
        whereClause = `WHERE ${valueColumnName} <= ${closestTo}`
        break;
      case 'larger':
        whereClause = `WHERE ${valueColumnName} >= ${closestTo}`
    }

    const query = `SELECT ${valueColumnName} as value, MIN(ABS(${closestTo} - ${valueColumnName})) as diff FROM ${tableName} ${whereClause} ORDER BY ${valueColumnName} ASC LIMIT 1 `
    const result = await this.selectQuery<any>(query)
    if (result.length > 0) {
      return result[0].value
    } else return null
  }

  async getBoxplotInfo(tableName: string, valueColumnName: string = 'value'): Promise<BoxPlotInfo> {
    const median = await this.findPercentileValue(0.5, tableName, valueColumnName)

    const percentile25 = await this.findPercentileValue(0.25, tableName, valueColumnName)
    const percentile75 = await this.findPercentileValue(0.75, tableName, valueColumnName)
    const iqr = percentile75 - percentile25
    const minWithoutOutlier = await this.findValueClosestTo(percentile25 - 1 * iqr, tableName, 'larger', valueColumnName)
    const maxWithoutOutlier = await this.findValueClosestTo(percentile75 + 1 * iqr, tableName, 'smaller', valueColumnName)
    //const minWithoutOutlier = percentile25 - 2 * iqr
    //const maxWithoutOutlier = percentile75 + 2 * iqr

    return {
      median,
      percentile25,
      percentile75,
      iqr,
      minWithoutOutlier,
      maxWithoutOutlier
    }
  }

  async getAggregatedValue(
    tableName: FitbitLocalTableName,
    aggregatedColumnInfos: Array<{
      type: SQLiteHelper.AggregationType,
      aggregatedColumnName: string,
      as: string
    }>,
    condition: string,
    parameters: any[],
  ): Promise<{ [key: string]: number }> {
    const query =
      `SELECT 
      ${aggregatedColumnInfos.map(info => `${info.type}(${info.aggregatedColumnName}) as ${info.as}`).join(',')}
       FROM ${tableName} WHERE ${condition}`;
    const [result] = await (await this.open()).executeSql(query, parameters);
    if (result.rows.length > 0) {
      return result.rows.item(0);
    } else return null;
  }


  private async exportDailySummaryColumn(...tableInfos: Array<{ schema: SQLiteHelper.TableSchema, exportedValueColumns: { [key: string]: string } }>): Promise<{ fields: Array<string>, data: Array<any> }> {

    if (tableInfos.length > 0) {

      const rowsPerTable = await Promise.all(tableInfos.map(async tableInfo => {
        const query = `SELECT
      ${tableInfo.schema.name}.numberedDate as numberedDate,
      ${tableInfo.schema.name}.year as year,
      ${tableInfo.schema.name}.month as month,
      ${tableInfo.schema.name}.dayOfWeek as dayOfWeek,
      ${Object.keys(tableInfo.exportedValueColumns).map(columnName => tableInfo.exportedValueColumns[columnName] != null ?
          (tableInfo.schema.name + "." + columnName + " as " + tableInfo.exportedValueColumns[columnName])
          : (tableInfo.schema.name + "." + columnName)).join(",\n")} FROM
      ${tableInfo.schema.name}`

        const [queryResult] = await (await this.open()).executeSql(query)
        return {
          tableInfo: tableInfo,
          queriedRows: queryResult.rows.raw()
        }
      }))

      const headers = ["index", "date", "numberedDate", "year", "month", "dayOfWeek"].concat([].concat.apply([], tableInfos.map(info => Object.keys(info.exportedValueColumns).map(key => info.exportedValueColumns[key] || key))))

      const uniqueDates = new Set([].concat.apply([], rowsPerTable.map(entry => entry.queriedRows.map(r => r.numberedDate))))
      console.log("Total ", uniqueDates.size, " days of data.")

      const joinedRows = []

      for (const numberedDate of uniqueDates) {
        const matchedElements = rowsPerTable.map(entry => entry.queriedRows.find(elm => elm.numberedDate === numberedDate))
        let merged = matchedElements[0]

        if (matchedElements.length > 1) {
          for (let i = 1; i < matchedElements.length; i++) {
            merged = merge(merged, matchedElements[i])
          }
        }

        merged["date"] = DateTimeHelper.toFormattedString(merged["numberedDate"])

        joinedRows.push(merged)
      }

      joinedRows.sort((a, b) => {
        if (a.numberedDate > b.numberedDate) {
          return -1
        } else if (a.numberedDate === b.numberedDate) {
          return 0
        } else {
          return 1
        }
      })

      joinedRows.forEach((row, i) => {
        row["index"] = i
      })

      return {
        fields: headers,
        data: joinedRows
      }
    }
    else return null
  }

  async exportToCsv(): Promise<Array<{ name: string, csv: string }>> {

    const joinedTable = await this.exportDailySummaryColumn(
      {
        schema: StepCountSchema,
        exportedValueColumns: {
          value: 'step'
        }
      },
      {
        schema: MainSleepLogSchema,
        exportedValueColumns: {
          lengthInSeconds: 'sleepLengthSeconds',
          bedTimeDiffSeconds: null,
          wakeTimeDiffSeconds: null
        }
      },
      {
        schema: WeightTrendSchema,
        exportedValueColumns: {
          value: "kg"
        }
      },
      {
        schema: RestingHeartRateSchema,
        exportedValueColumns: {
          value: 'bpm'
        }
      }
    )

    const result = [{ name: "daily_summary", csv: Papa.unparse(joinedTable) }]

    const schemas = [
      StepCountSchema,
      RestingHeartRateSchema,
      WeightTrendSchema,
      WeightLogSchema,
      MainSleepLogSchema,
      IntraDayStepCountSchema,
      IntraDayHeartRateInfoSchema,
    ]

    for (const schema of schemas) {
      const [queryResult] = await (await this.open()).executeSql(`SELECT * FROM ${schema.name}`)
      if (queryResult) {
        if (queryResult.rows) {
          if (queryResult.rows.length > 0) {
            const rows = queryResult.rows.raw()
            if (schema.columns.numberedDate) {
              rows.forEach(row => {
                row["date"] = DateTimeHelper.toFormattedString(row["numberedDate"])
              })
            }
            result.push({ name: schema.name, csv: Papa.unparse(rows) })
          }
        }
      }
    }
    return result
  }
}
