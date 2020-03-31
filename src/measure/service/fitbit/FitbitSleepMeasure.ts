import { FitbitSleepQueryResult } from './types';
import { FitbitRangeMeasure } from './FitbitRangeMeasure';
import { makeFitbitSleepApiUrl, FITBIT_DATE_FORMAT } from './api';
import { DateTimeHelper } from '@data-at-hand/core/utils/time';
import {
  parse,
  getDay,
  parseISO,
  differenceInSeconds,
  startOfDay,
} from 'date-fns';
import {
  SleepRangedData,
  IDailySleepSummaryEntry,
  GroupedData,
  GroupedRangeData,
  IAggregatedValue,
  IAggregatedRangeValue,
  FilteredDailyValues,
  BoxPlotInfo,
  OverviewSourceRow,
} from '@core/exploration/data/types';
import { DataSourceType } from '@data-at-hand/core/measure/DataSourceSpec';
import {
  FitbitLocalTableName,
  makeCyclicGroupQuery,
  makeGroupSelectClause,
  makeAggregatedQuery,
  makeCycleDimensionRangeQuery,
} from './sqlite/database';
import { SQLiteHelper } from '@utils/sqlite-helper';
import {
  CyclicTimeFrame,
  CycleDimension,
  getCycleTypeOfDimension,
  getTimeKeyOfDimension,
} from '@core/exploration/cyclic_time';

const columnNamesForRangeData = [
  'numberedDate',
  'year',
  'month',
  'dayOfWeek',
  'quality',
  'lengthInSeconds',
  'bedTimeDiffSeconds',
  'wakeTimeDiffSeconds',
];

const aggregationSelectClause =
  'AVG(bedTimeDiffSeconds) as avgA, MIN(bedTimeDiffSeconds) as minA, MAX(bedTimeDiffSeconds) as maxA, AVG(wakeTimeDiffSeconds) as avgB, MIN(wakeTimeDiffSeconds) as minB, MAX(wakeTimeDiffSeconds) as maxB, COUNT(bedTimeDiffSeconds) as n';

export class FitbitSleepMeasure extends FitbitRangeMeasure<
  FitbitSleepQueryResult
  > {

  key: string = 'sleep';
  displayName = "Sleep"

  protected resourcePropertyKey: string = 'sleep';
  protected maxQueryRangeLength: number = 101;
  protected queryFunc(startDate: number, endDate: number): Promise<FitbitSleepQueryResult> {
    return this.service.core.fetchSleepLogs(startDate, endDate)
  }

  protected async getBoxPlotInfoOfDatasetFromDb(key: "range" | "length"): Promise<BoxPlotInfo> {
    switch (key) {
      case 'length':
        return this.service.core.fitbitLocalDbManager.getBoxplotInfo(FitbitLocalTableName.SleepLog, 'lengthInSeconds')
      case 'range':
        const bedTimeInfo = await this.service.core.fitbitLocalDbManager.getBoxplotInfo(FitbitLocalTableName.SleepLog, 'bedTimeDiffSeconds')
        const wakeTimeInfo = await this.service.core.fitbitLocalDbManager.getBoxplotInfo(FitbitLocalTableName.SleepLog, 'wakeTimeDiffSeconds')
        return {
          maxWithoutOutlier: Math.max(bedTimeInfo.maxWithoutOutlier, wakeTimeInfo.maxWithoutOutlier),
          minWithoutOutlier: Math.min(bedTimeInfo.minWithoutOutlier, wakeTimeInfo.minWithoutOutlier),
          median: (bedTimeInfo.median + wakeTimeInfo.median) / 2,
          iqr: 0,
          percentile25: 0,
          percentile75: 0
        }
    }
  }

  protected handleQueryResultEntry(
    entries: Array<any>,
    now: Date,
  ): Promise<void> {
    const entriesReady = entries
      .map(entry => {
        if (entry.isMainSleep === true) {
          // we are interested only in the main sleep.
          const numberedDate = DateTimeHelper.fromFormattedString(
            entry.dateOfSleep,
          );
          const date = startOfDay(
            parse(entry.dateOfSleep, FITBIT_DATE_FORMAT, now),
          );

          const bedTime = parseISO(entry.startTime);
          const wakeTime = parseISO(entry.endTime);

          const bedTimeDiff = differenceInSeconds(bedTime, date);
          const wakeTimeDiff = differenceInSeconds(wakeTime, date);

          return {
            quality: entry.efficiency,
            lengthInSeconds: /*entry.duration / 1000*/ entry.minutesAsleep * 60,
            bedTimeDiffSeconds: bedTimeDiff,
            wakeTimeDiffSeconds: wakeTimeDiff,
            stageType: entry.type === 'classic' ? 'simple' : entry.type,

            listOfLevels: entry.levels.data
              .map((levelEntry: { level: string; dateTime: string; seconds: string; }) => {
                return (
                  levelEntry.level +
                  '|' +
                  differenceInSeconds(parseISO(levelEntry.dateTime), bedTime) +
                  '|' +
                  levelEntry.seconds
                );
              })
              .join(','),
            numberedDate,
            year: DateTimeHelper.getYear(numberedDate),
            month: DateTimeHelper.getMonth(numberedDate),
            dayOfWeek: getDay(date),
          };
        } else return null;
      })
      .filter(e => e != null);

    return this.service.core.fitbitLocalDbManager.insert(
      FitbitLocalTableName.SleepLog,
      entriesReady,
    );
  }

  async fetchData(
    sourceType: DataSourceType.SleepRange | DataSourceType.HoursSlept,
    startDate: number,
    endDate: number,
    includeStatistics: boolean, includeToday: boolean
  ): Promise<SleepRangedData> {
    const condition = '`numberedDate` BETWEEN ? AND ? ORDER BY `numberedDate`';
    const params = [startDate, endDate];
    const logs = await this.service.core.fitbitLocalDbManager.fetchData<
      IDailySleepSummaryEntry
    >(
      FitbitLocalTableName.SleepLog,
      condition,
      params,
      columnNamesForRangeData,
    );

    const base = {
      source: sourceType,
      range: [startDate, endDate],
      data: logs,
      today: null,
      statistics: null,
    } as OverviewSourceRow;

    let todayLog
    if (includeToday === true) {
      const todayLogs = await this.service.core.fitbitLocalDbManager.fetchData<
        IDailySleepSummaryEntry
      >(
        FitbitLocalTableName.SleepLog,
        '`numberedDate` = ? LIMIT 1',
        [DateTimeHelper.toNumberedDateFromDate(this.service.core.getToday())],
        columnNamesForRangeData,
      );

      todayLog = todayLogs.length > 0 ? todayLogs[0] : null;
    }

    switch (sourceType) {
      case DataSourceType.HoursSlept:
        {
          base.today = todayLog != null ? todayLog.lengthInSeconds : null;

          let statistics
          if (includeStatistics === true) {
            statistics = await this.service.core.fitbitLocalDbManager.getAggregatedValue(FitbitLocalTableName.SleepLog, [
              { type: SQLiteHelper.AggregationType.AVG, aggregatedColumnName: 'lengthInSeconds', as: 'avg' },
              { type: SQLiteHelper.AggregationType.MIN, aggregatedColumnName: 'lengthInSeconds', as: 'min' },
              { type: SQLiteHelper.AggregationType.MAX, aggregatedColumnName: 'lengthInSeconds', as: 'max' }
            ], condition, params)
          }

          base.statistics = [
            {
              type: 'avg',
              value: statistics != null ? statistics["avg"] : null
            },
            {
              type: 'range',
              value: statistics != null ? [statistics["min"], statistics["max"]] : null
            },
          ];
        }

        break;
      case DataSourceType.SleepRange:
        {
          base.today =
            todayLog != null
              ? [todayLog.bedTimeDiffSeconds, todayLog.wakeTimeDiffSeconds]
              : null;

          if (includeStatistics === true) {
            const statistics = await this.service.core.fitbitLocalDbManager.getAggregatedValue(FitbitLocalTableName.SleepLog, [
              { type: SQLiteHelper.AggregationType.AVG, aggregatedColumnName: 'wakeTimeDiffSeconds', as: 'wakeTime' },
              { type: SQLiteHelper.AggregationType.AVG, aggregatedColumnName: 'bedTimeDiffSeconds', as: 'bedTime' }
            ], condition, params)

            base.statistics = [
              {
                type: 'bedtime',
                value: statistics['bedTime']
              },
              {
                type: 'waketime',
                value: statistics['wakeTime']
              },
            ];
          }

          
        }
        break;
    }

    return base;
  }

  async fetchIntraDayData(date: number): Promise<IDailySleepSummaryEntry> {
    const dailyLogs = await this.service.core.fitbitLocalDbManager.fetchData<
      IDailySleepSummaryEntry
    >(FitbitLocalTableName.SleepLog, '`numberedDate` = ? LIMIT 1', [date]);

    if (dailyLogs.length > 0) {
      const dailyLog = dailyLogs[0];
      if (dailyLog.listOfLevels && dailyLog.listOfLevels.length > 0) {
        const split = (dailyLog.listOfLevels as any).split(',');
        dailyLog.listOfLevels = split.map((elm: string) => {
          const elmSplit = elm.split('|');
          return {
            type: elmSplit[0],
            startBedtimeDiff: Number.parseInt(elmSplit[1]),
            lengthInSeconds: Number.parseInt(elmSplit[2]),
          };
        });
      }
      return dailyLog;
    } else return null;
  }

  async fetchHoursSleptCyclicGroupedData(start: number, end: number, cycleType: CyclicTimeFrame,
  ): Promise<GroupedData> {
    const result = await this.service.core.fitbitLocalDbManager.selectQuery(
      makeCyclicGroupQuery(FitbitLocalTableName.SleepLog, start, end, cycleType,
        makeGroupSelectClause(
          'lengthInSeconds',
          'lengthInSeconds',
          'lengthInSeconds',
          'lengthInSeconds',
          'lengthInSeconds',
        ),
      ),
    );

    return {
      data: result as any,
    };
  }

  async fetchSleepRangeCyclicGroupedData(
    start: number,
    end: number,
    cycleType: CyclicTimeFrame,
  ): Promise<GroupedRangeData> {
    const result = await this.service.core.fitbitLocalDbManager.selectQuery(
      makeCyclicGroupQuery(
        FitbitLocalTableName.SleepLog,
        start,
        end,
        cycleType,
        aggregationSelectClause,
      ),
    );

    return {
      data: result as any,
    };
  }

  async fetchHoursSleptAggregatedData(
    start: number,
    end: number,
  ): Promise<IAggregatedValue> {
    const result = await this.service.core.fitbitLocalDbManager.selectQuery(
      makeAggregatedQuery(
        FitbitLocalTableName.SleepLog,
        start,
        end,
        makeGroupSelectClause(
          'lengthInSeconds',
          'lengthInSeconds',
          'lengthInSeconds',
          'lengthInSeconds',
          'lengthInSeconds',
        ),
      ),
    );

    if (result.length > 0) {
      return result[0] as any;
    } else return null;
  }

  async fetchHoursSleptRangeDimensionData(start: number, end: number, cycleDimension: CycleDimension): Promise<IAggregatedValue[]> {
    const result = await this.service.core.fitbitLocalDbManager.selectQuery<IAggregatedValue>(
      makeCycleDimensionRangeQuery(
        FitbitLocalTableName.SleepLog,
        start,
        end,
        cycleDimension,
        makeGroupSelectClause(
          'lengthInSeconds',
          'lengthInSeconds',
          'lengthInSeconds',
          'lengthInSeconds',
          'lengthInSeconds',
        ),
      ),
    );
    return result;
  }

  async fetchSleepRangeAggregatedData(
    start: number,
    end: number,
  ): Promise<IAggregatedRangeValue> {
    const result = await this.service.core.fitbitLocalDbManager.selectQuery(
      makeAggregatedQuery(
        FitbitLocalTableName.SleepLog,
        start,
        end,
        aggregationSelectClause,
      ),
    );

    if (result.length > 0) {
      return result[0] as any;
    } else return null;
  }

  async fetchSleepRangeCycleRangeDimensionData(
    start: number,
    end: number,
    cycleDimension: CycleDimension,
  ): Promise<IAggregatedRangeValue[]> {
    const result = await this.service.core.fitbitLocalDbManager.selectQuery<IAggregatedRangeValue>(
      makeCycleDimensionRangeQuery(
        FitbitLocalTableName.SleepLog,
        start,
        end,
        cycleDimension,
        aggregationSelectClause,
      ),
    );
    return result;
  }

  async fetchCycleDailyDimensionData(type: DataSourceType.SleepRange | DataSourceType.HoursSlept, start: number, end: number, cycleDimension: CycleDimension): Promise<FilteredDailyValues> {
    let condition = "`numberedDate` BETWEEN ? AND ?"

    const cycleType = getCycleTypeOfDimension(cycleDimension)
    switch (cycleType) {
      case CyclicTimeFrame.DayOfWeek:
        condition += " AND `dayOfWeek` = " + getTimeKeyOfDimension(cycleDimension)
        break;
    }

    condition += " ORDER BY `numberedDate`"
    const params = [start, end]

    let columns: string[] = null
    switch (type) {
      case DataSourceType.HoursSlept:
        columns = ["numberedDate", "lengthInSeconds as value"]
        break;
      case DataSourceType.SleepRange:
        columns = ["numberedDate", "bedTimeDiffSeconds as value", "wakeTimeDiffSeconds as value2"]
        break;
    }

    const list = await this.service.core.fitbitLocalDbManager.fetchData<{ numberedDate: number, value: number }>(FitbitLocalTableName.SleepLog, condition, params, columns)

    return {
      type: type === DataSourceType.SleepRange ? 'range' : 'length',
      data: list
    }
  }
}
