import {DateTimeHelper} from '../../../time';
import {IDataEntry} from './realm/schema';
import {parse, getDay} from 'date-fns';
import {FITBIT_DATE_FORMAT} from './api';
import {FitbitRangeMeasure} from './FitbitRangeMeasure';

export abstract class FitbitSummaryLogMeasure<
  QueryResultType,
  RealmEntryClassType extends IDataEntry<any>
> extends FitbitRangeMeasure<QueryResultType> {

  protected abstract realmEntryClassType;
  protected maxQueryRangeLength: number = 1095;
  protected abstract getQueryResultEntryValue(queryResultEntry: any): any;

  fetchData(startDate: Date, endDate: Date): Promise<any> {
    const filtered = this.service.realm
      .objects<RealmEntryClassType>(this.realmEntryClassType)
      .filtered(
        'numberedDate >= ' +
          DateTimeHelper.toNumberedDateFromDate(startDate) +
          ' AND numberedDate <= ' +
          DateTimeHelper.toNumberedDateFromDate(endDate),
      );
    return filtered.snapshot().map(v => v.toJson()) as any;
  }

  protected handleQueryResultEntry(realm: Realm, entry: any, now: Date) {
    const numberedDate = DateTimeHelper.fromFormattedString(entry.dateTime);
    const date = parse(entry.dateTime, FITBIT_DATE_FORMAT, now);

    const value = this.getQueryResultEntryValue(entry);
    if (value != null && Number.isNaN(value) === false) {
      realm.create(
        this.realmEntryClassType,
        {
          value,
          numberedDate,
          year: DateTimeHelper.getYear(numberedDate),
          month: DateTimeHelper.getMonth(numberedDate),
          dayOfWeek: getDay(date),
        },
        true,
      );
    }
  }
}
