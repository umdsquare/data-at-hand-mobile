import {FitbitSleepQueryResult} from './types';
import {FitbitRangeMeasure} from './FitbitRangeMeasure';
import {makeFitbitSleepApiUrl, FITBIT_DATE_FORMAT} from './api';
import {DateTimeHelper} from '../../../time';
import {DailyMainSleepEntry} from './realm/schema';
import {
  parse,
  getDay,
  parseISO,
  differenceInSeconds,
  startOfDay,
} from 'date-fns';
import {SleepRangedData} from '../../../core/exploration/data/types';
import {DataSourceType} from '../../DataSourceSpec';

export class FitbitSleepMeasure extends FitbitRangeMeasure<
  FitbitSleepQueryResult
> {
  key: string = 'sleep';

  protected resourcePropertyKey: string = 'sleep';
  protected maxQueryRangeLength: number = 101;
  protected makeQueryUrl(startDate: number, endDate: number): string {
    return makeFitbitSleepApiUrl(startDate, endDate);
  }
  protected handleQueryResultEntry(realm: Realm, entry: any, now: Date) {
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

      realm.create(
        DailyMainSleepEntry,
        {
          quality: entry.efficiency,
          lengthInSeconds: entry.duration / 1000,
          bedTimeDiffSeconds: bedTimeDiff,
          wakeTimeDiffSeconds: wakeTimeDiff,

          listOfLevels: entry.levels.data.map(levelEntry => {
            return (
              levelEntry.level +
              '|' +
              differenceInSeconds(parseISO(levelEntry.dateTime), bedTime) +
              '|' +
              levelEntry.seconds
            );
          }),
          numberedDate,
          year: DateTimeHelper.getYear(numberedDate),
          month: DateTimeHelper.getMonth(numberedDate),
          dayOfWeek: getDay(date),
        },
        true,
      );
    }
  }

  async fetchData(
    sourceType: DataSourceType.SleepRange | DataSourceType.HoursSlept,
    startDate: number,
    endDate: number,
  ): Promise<SleepRangedData> {
    const filtered = this.service.realm
      .objects<DailyMainSleepEntry>(DailyMainSleepEntry)
      .filtered(
        'numberedDate >= ' + startDate +
          ' AND numberedDate <= ' + endDate,
      ).sorted("numberedDate")

    const logs = filtered.snapshot().map(v => v.toJson(false));

    const base = {
      source: sourceType,
      range: [startDate, endDate],
      data: logs,
      today: null,
      statistics: null,
    };

    const todayLogs = this.service.realm
      .objects<DailyMainSleepEntry>(DailyMainSleepEntry)
      .filtered(
        'numberedDate = ' + DateTimeHelper.toNumberedDateFromDate(new Date()),
      );

    const todayLog = todayLogs.length > 0 ? todayLogs[0] : null;

    switch (sourceType) {
      case DataSourceType.HoursSlept:
        base.today = todayLog != null ? todayLog.lengthInSeconds : null;
        base.statistics = [
          {type: 'avg', value: filtered.avg('lengthInSeconds')},
          {type: 'range', value: [filtered.min('lengthInSeconds'), filtered.max('lengthInSeconds')]},
        ]

        break;
      case DataSourceType.SleepRange:
        base.today =
          todayLog != null
            ? [todayLog.bedTimeDiffSeconds, todayLog.wakeTimeDiffSeconds]
            : null;
        
            base.statistics = [
              {type: 'waketime', value: filtered.avg('wakeTimeDiffSeconds')},
              {type: 'bedtime', value: filtered.avg('bedTimeDiffSeconds')},
            ]
        break;
    }

    return base;
  }
}