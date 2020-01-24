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

  protected getLocalRangeQueryCondition(startDate: Date, endDate: Date): string{
    return 'numberedDate >= ' +
    DateTimeHelper.toNumberedDateFromDate(startDate) +
    ' AND numberedDate <= ' +
    DateTimeHelper.toNumberedDateFromDate(endDate)
  }

  fetchPreliminaryData(startDate: Date, endDate: Date): Promise<{list: Array<any>, avg: number, min: number, max: number, sum: number }> {
    const filtered = this.service.realm
      .objects<RealmEntryClassType>(this.realmEntryClassType)
      .filtered(this.getLocalRangeQueryCondition(startDate, endDate));
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
    const today = new Date()
    const filtered = this.service.realm
      .objects<RealmEntryClassType>(this.realmEntryClassType)
      .filtered(this.getLocalRangeQueryCondition(today, today));
    
    return filtered.length > 0? filtered[0]["value"] : null

    /*
    if(value){
        return {
            label: this.todayLabel,
            value: value,
            formatted: this.formatTodayValue(value)
        }
    }else{
        return {
            label: this.todayLabel,
            value: null,
            formatted: [{text: "No value", type:'value'}]
        }
    }*/
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
