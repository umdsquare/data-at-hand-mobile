import {FitbitSleepQueryResult} from './types';
import {FitbitRangeMeasure} from './FitbitRangeMeasure';
import {makeFitbitSleepApiUrl, FITBIT_DATE_FORMAT} from './api';
import {DateTimeHelper} from '../../../time';
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
} from '../../../core/exploration/data/types';
import {DataSourceType} from '../../DataSourceSpec';
import {
  FitbitLocalTableName,
  makeCyclicGroupQuery,
  makeGroupSelectClause,
  makeAggregatedQuery,
} from './sqlite/database';
import {SQLiteHelper} from '../../../database/sqlite/sqlite-helper';
import { CyclicTimeFrame } from '../../../core/exploration/cyclic_time';

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

export class FitbitSleepMeasure extends FitbitRangeMeasure<
  FitbitSleepQueryResult
> {
  key: string = 'sleep';

  protected resourcePropertyKey: string = 'sleep';
  protected maxQueryRangeLength: number = 101;
  protected makeQueryUrl(startDate: number, endDate: number): string {
    return makeFitbitSleepApiUrl(startDate, endDate);
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
            lengthInSeconds: entry.duration / 1000,
            bedTimeDiffSeconds: bedTimeDiff,
            wakeTimeDiffSeconds: wakeTimeDiff,
            stageType: entry.type === 'classic' ? 'simple' : entry.type,

            listOfLevels: entry.levels.data
              .map(levelEntry => {
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

    return this.service.fitbitLocalDbManager.insert(
      FitbitLocalTableName.SleepLog,
      entriesReady,
    );
  }

  async fetchData(
    sourceType: DataSourceType.SleepRange | DataSourceType.HoursSlept,
    startDate: number,
    endDate: number,
  ): Promise<SleepRangedData> {
    const condition = '`numberedDate` BETWEEN ? AND ? ORDER BY `numberedDate`';
    const params = [startDate, endDate];
    const logs = await this.service.fitbitLocalDbManager.fetchData<
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
    };

    const todayLogs = await this.service.fitbitLocalDbManager.fetchData<
      IDailySleepSummaryEntry
    >(
      FitbitLocalTableName.SleepLog,
      '`numberedDate` = ? LIMIT 1',
      [DateTimeHelper.toNumberedDateFromDate(new Date())],
      columnNamesForRangeData,
    );

    const todayLog = todayLogs.length > 0 ? todayLogs[0] : null;

    switch (sourceType) {
      case DataSourceType.HoursSlept:
        base.today = todayLog != null ? todayLog.lengthInSeconds : null;
        base.statistics = [
          {
            type: 'avg',
            value: await this.service.fitbitLocalDbManager.getAggregatedValue(
              FitbitLocalTableName.SleepLog,
              SQLiteHelper.AggregationType.AVG,
              'lengthInSeconds',
              condition,
              params,
            ),
          },
          {
            type: 'range',
            value: [
              await this.service.fitbitLocalDbManager.getAggregatedValue(
                FitbitLocalTableName.SleepLog,
                SQLiteHelper.AggregationType.MIN,
                'lengthInSeconds',
                condition,
                params,
              ),
              await this.service.fitbitLocalDbManager.getAggregatedValue(
                FitbitLocalTableName.SleepLog,
                SQLiteHelper.AggregationType.MAX,
                'lengthInSeconds',
                condition,
                params,
              ),
            ],
          },
        ];

        break;
      case DataSourceType.SleepRange:
        base.today =
          todayLog != null
            ? [todayLog.bedTimeDiffSeconds, todayLog.wakeTimeDiffSeconds]
            : null;

        base.statistics = [
          {
            type: 'waketime',
            value: await this.service.fitbitLocalDbManager.getAggregatedValue(
              FitbitLocalTableName.SleepLog,
              SQLiteHelper.AggregationType.AVG,
              'wakeTimeDiffSeconds',
              condition,
              params,
            ),
          },
          {
            type: 'bedtime',
            value: await this.service.fitbitLocalDbManager.getAggregatedValue(
              FitbitLocalTableName.SleepLog,
              SQLiteHelper.AggregationType.AVG,
              'bedTimeDiffSeconds',
              condition,
              params,
            ),
          },
        ];
        break;
    }

    return base;
  }

  async fetchIntraDayData(date: number): Promise<IDailySleepSummaryEntry> {
    const dailyLogs = await this.service.fitbitLocalDbManager.fetchData<
      IDailySleepSummaryEntry
    >(FitbitLocalTableName.SleepLog, '`numberedDate` = ? LIMIT 1', [date]);

    if (dailyLogs.length > 0) {
      const dailyLog = dailyLogs[0];
      if (dailyLog.listOfLevels && dailyLog.listOfLevels.length > 0) {
        const split = (dailyLog.listOfLevels as any).split(',');
        dailyLog.listOfLevels = split.map(elm => {
          const elmSplit = elm.split('|');
          return {
            type: elmSplit[0],
            startBedtimeDiff: Number.parseInt(elmSplit[1]),
            lengthInSeconds: Number.parseInt(elmSplit[2]),
          };
        });
      }
      return dailyLog;
    } else return {} as any;
  }

  async fetchHoursSleptCyclicGroupedData(
    start: number,
    end: number,
    cycleType: CyclicTimeFrame,
  ): Promise<GroupedData> {
    const result = await this.service.fitbitLocalDbManager.selectQuery(
      makeCyclicGroupQuery(
        FitbitLocalTableName.SleepLog,
        start,
        end,
        cycleType,
        makeGroupSelectClause(
          'lengthInSeconds',
          'lengthInSeconds',
          'lengthInSeconds',
          'lengthInSeconds',
          'lengthInSeconds'
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
    const result = await this.service.fitbitLocalDbManager.selectQuery(
      makeCyclicGroupQuery(
        FitbitLocalTableName.SleepLog,
        start,
        end,
        cycleType,
        'AVG(bedTimeDiffSeconds) as avgA, MIN(bedTimeDiffSeconds) as minA, MAX(bedTimeDiffSeconds) as maxA, AVG(wakeTimeDiffSeconds) as avgB, MIN(wakeTimeDiffSeconds) as minB, MAX(wakeTimeDiffSeconds) as maxB, COUNT(bedTimeDiffSeconds) as n',
      ),
    );

    return {
      data: result as any,
    };
  }

  async fetchHoursSleptAggregatedData(
    start: number,
    end: number
  ): Promise<IAggregatedValue>{
    const result = await this.service.fitbitLocalDbManager.selectQuery(makeAggregatedQuery(FitbitLocalTableName.SleepLog, start, end, makeGroupSelectClause(
      'lengthInSeconds',
      'lengthInSeconds',
      'lengthInSeconds',
      'lengthInSeconds',
      'lengthInSeconds'
    )))

    if(result.length > 0){
      return result[0] as any
    }else return null
  }

  async fetchSleepRangeAggregatedData(start: number, end: number): Promise<IAggregatedRangeValue>{
    const result = await this.service.fitbitLocalDbManager.selectQuery(makeAggregatedQuery(FitbitLocalTableName.SleepLog, start, end, 
      'AVG(bedTimeDiffSeconds) as avgA, MIN(bedTimeDiffSeconds) as minA, MAX(bedTimeDiffSeconds) as maxA, AVG(wakeTimeDiffSeconds) as avgB, MIN(wakeTimeDiffSeconds) as minB, MAX(wakeTimeDiffSeconds) as maxB, COUNT(bedTimeDiffSeconds) as n',
    ))
    
    if(result.length > 0){
      return result[0] as any
    }else return null
  }

}
