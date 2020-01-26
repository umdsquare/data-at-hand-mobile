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

  protected getLocalRangeQueryCondition(startDate: number, endDate: number): string{
    return 'numberedDate >= ' + startDate +
    ' AND numberedDate <= ' + endDate
  }

  fetchPreliminaryData(startDate: number, endDate: number): Promise<{list: Array<any>, avg: number, min: number, max: number, sum: number }> {
    const filtered = this.service.realm
      .objects<RealmEntryClassType>(this.realmEntryClassType)
      .filtered(this.getLocalRangeQueryCondition(startDate, endDate))
      .sorted("numberedDate")
      
    const avg = filtered.avg('value') as number
    const min = filtered.min('value') as number
    const max = filtered.max('value') as number
    const sum = filtered.sum('value') as number
    
    return Promise.resolve({
        list: filtered.snapshot().map(v => v.toJson()),
        avg,
        min,
        max,
        sum
    })
  }

  fetchTodayValue(): number{
    const today = DateTimeHelper.toNumberedDateFromDate(new Date())
    const filtered = this.service.realm
      .objects<RealmEntryClassType>(this.realmEntryClassType)
      .filtered(this.getLocalRangeQueryCondition(today, today));
    
    return filtered.length > 0? filtered[0]["value"] : null
  }

  //abstract formatTodayValue(value: number): Array<{text: string, type: 'unit'|'value'}>

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
