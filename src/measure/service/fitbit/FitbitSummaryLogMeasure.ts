import {IDatumBase} from '../../../database/types';
import {DateTimeHelper} from '../../../time';
import {DailyStepCountEntry, IDataEntry} from './realm/schema';
import {FitbitServiceMeasure} from './FitbitServiceMeasure';
import {parse, getDay} from 'date-fns';
import {FITBIT_DATE_FORMAT} from './api';

export abstract class FitbitSummaryLogMeasure<
  QueryResultType,
  RealmEntryClassType extends IDataEntry<any>
> extends FitbitServiceMeasure {
  protected abstract realmEntryClassType;
  protected abstract resourcePropertyKey: string;
  protected abstract makeQueryUrl(startDate: number, endDate: number): string;
  protected abstract getQueryResultEntryValue(queryResultEntry: any): any;

  protected async fetchAndCacheFitbitData(
    startDate: number,
    endDate: number,
  ): Promise<void> {
    console.log(
      'Load Fitbit ',
      this.key,
      ' data from ',
      startDate,
      'to',
      endDate,
    );
    const benchMarkStart = Date.now();
    const chunks = DateTimeHelper.splitRange(startDate, endDate, 1095);

    const queryResult: Array<QueryResultType> = await Promise.all(
      chunks.map(chunk =>
        this.service.fetchFitbitQuery(this.makeQueryUrl(chunk[0], chunk[1])),
      ),
    );

    const result: QueryResultType = {} as any;
    result[this.resourcePropertyKey] = [].concat.apply(
      [],
      queryResult.map(r => r[this.resourcePropertyKey]),
    );

    console.log(
      'Finished Loading',
      this.key,
      'data - ',
      result[this.resourcePropertyKey].length,
      'rows. Took',
      Date.now() - benchMarkStart,
      'millis.',
    );

    const now = new Date();

    this.service.realm.write(() => {
      result[this.resourcePropertyKey].forEach(entry => {
        const numberedDate = DateTimeHelper.fromFormattedString(entry.dateTime);
        const date = parse(entry.dateTime, FITBIT_DATE_FORMAT, now);

        const value = this.getQueryResultEntryValue(entry);
        if (value != null && Number.isNaN(value) === false) {
          this.service.realm.create(
            this.realmEntryClassType,
            {
              value: this.getQueryResultEntryValue(entry),
              numberedDate,
              year: DateTimeHelper.getYear(numberedDate),
              month: DateTimeHelper.getMonth(numberedDate),
              dayOfWeek: getDay(date),
            },
            true,
          );
        }
      });
    });

    console.log('Finish storing data into Realm.');
  }

  fetchData(startDate: Date, endDate: Date): Promise<IDatumBase[]> {
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
}
