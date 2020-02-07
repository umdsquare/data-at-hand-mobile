import {DateTimeHelper} from '../../../time';
import {FitbitServiceMeasure} from './FitbitServiceMeasure';

export abstract class FitbitRangeMeasure<
  QueryResultType> extends FitbitServiceMeasure {

  protected abstract resourcePropertyKey: string;
  protected abstract maxQueryRangeLength: number;
  protected abstract makeQueryUrl(startDate: number, endDate: number): string;

  protected abstract handleQueryResultEntry(entries: any[], now: Date): Promise<void>

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
    const chunks = DateTimeHelper.splitRange(startDate, endDate, this.maxQueryRangeLength);

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

    /*
    this.service.realm.write(() => {
      result[this.resourcePropertyKey].forEach(entry => {
        this.handleQueryResultEntry(this.service.realm, entry, now)
      });
    });*/

    this.handleQueryResultEntry(result[this.resourcePropertyKey], now)

    console.log('Finish storing data into Realm.');
  }
}
