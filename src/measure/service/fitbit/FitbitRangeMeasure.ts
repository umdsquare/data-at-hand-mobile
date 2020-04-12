import { DateTimeHelper } from '@data-at-hand/core/utils/time';
import { FitbitServiceMeasure } from './FitbitServiceMeasure';
import { fastConcatTo } from '@data-at-hand/core/utils';

export abstract class FitbitRangeMeasure<
  QueryResultType> extends FitbitServiceMeasure {

  protected abstract resourcePropertyKey: string;
  protected abstract maxQueryRangeLength: number;
  protected abstract queryFunc(startDate: number, endDate: number, prefetchMode: boolean): Promise<QueryResultType>


  protected abstract handleQueryResultEntry(entries: any[], now: Date): Promise<void>

  protected async fetchAndCacheFitbitData(
    startDate: number,
    endDate: number,
    tryPrefetch: boolean
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

    let queryResult: Array<QueryResultType>

    if (tryPrefetch === true && this.core.isPrefetchAvailable() === true) {
      try {
        queryResult = [await this.queryFunc(startDate, endDate, true)]
      } catch (ex) {
        console.log("prefetch error in ", this.resourcePropertyKey)
      }
    }

    if (queryResult == null) {
      const chunks = DateTimeHelper.splitRange(startDate, endDate, this.maxQueryRangeLength);

      queryResult = await Promise.all(
        chunks.map(chunk => this.queryFunc(chunk[0], chunk[1], false))
      );
    }


    const result: Array<any> = []
    for (let i = 0; i < queryResult.length; i++) {
      fastConcatTo(result, (queryResult[i] as any)[this.resourcePropertyKey])
    }

    console.log(
      'Finished Loading',
      this.key,
      'data - ',
      result.length,
      'rows. Took',
      Date.now() - benchMarkStart,
      'millis.',
    );

    const now = this.core.getToday()

    this.handleQueryResultEntry(result, now)

    console.log('Finish storing data into DB.');
  }
}
