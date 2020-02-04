import {DateTimeHelper} from '../../../time';
import {parse, getDay} from 'date-fns';
import {FITBIT_DATE_FORMAT} from './api';
import {FitbitRangeMeasure} from './FitbitRangeMeasure';
import { FitbitLocalTableName, makeCyclicGroupQuery, makeAggregatedQuery } from './sqlite/database';
import { SQLiteHelper } from '../../../database/sqlite/sqlite-helper';
import { GroupedData, IAggregatedValue } from '../../../core/exploration/data/types';
import { CyclicTimeFrame } from '../../../core/exploration/cyclic_time';

export abstract class FitbitSummaryLogMeasure<
  QueryResultType> extends FitbitRangeMeasure<QueryResultType> {
  protected maxQueryRangeLength: number = 1095;

  protected abstract dbTableName: FitbitLocalTableName;

  protected abstract getQueryResultEntryValue(queryResultEntry: any): any;

  protected getLocalRangeQueryCondition(
    startDate: number,
    endDate: number,
  ): string {
    return 'numberedDate >= ' + startDate + ' AND numberedDate <= ' + endDate;
  }

  async fetchPreliminaryData(
    startDate: number,
    endDate: number,
  ): Promise<{
    list: Array<any>;
    avg: number;
    min: number;
    max: number;
    sum: number;
  }> {

    const condition = "`numberedDate` BETWEEN ? AND ? ORDER BY `numberedDate`"
    const params = [startDate, endDate]
    const list = await this.service.fitbitLocalDbManager.fetchData(this.dbTableName, condition, params)
/*
    const filtered = this.service.realm
      .objects<RealmEntryClassType>(this.realmEntryClassType)
      .filtered(this.getLocalRangeQueryCondition(startDate, endDate))
      .sorted('numberedDate');

    const avg = filtered.avg('value') as number;
    const min = filtered.min('value') as number;
    const max = filtered.max('value') as number;
    const sum = filtered.sum('value') as number;*/

    return Promise.resolve({
      list,
      avg: await this.service.fitbitLocalDbManager.getAggregatedValue(this.dbTableName, SQLiteHelper.AggregationType.AVG, 'value', condition, params),
      min: await this.service.fitbitLocalDbManager.getAggregatedValue(this.dbTableName, SQLiteHelper.AggregationType.MIN, 'value', condition, params),
      max: await this.service.fitbitLocalDbManager.getAggregatedValue(this.dbTableName, SQLiteHelper.AggregationType.MAX, 'value', condition, params),
      sum: await this.service.fitbitLocalDbManager.getAggregatedValue(this.dbTableName, SQLiteHelper.AggregationType.SUM, 'value', condition, params),
    });
  }

  async  fetchTodayValue(): Promise<number> {
    const today = DateTimeHelper.toNumberedDateFromDate(new Date());

    const todayResult = await this.service.fitbitLocalDbManager.fetchData(this.dbTableName, "`numberedDate` = ?", [today])
    
    return todayResult.length > 0 ? todayResult[0]['value'] : null;
  }

  //abstract formatTodayValue(value: number): Array<{text: string, type: 'unit'|'value'}>

  protected async handleQueryResultEntry(entries: any[], now: Date) {
    const entriesReady = entries
      .map(entry => {
        const numberedDate = DateTimeHelper.fromFormattedString(entry.dateTime);
        const date = parse(entry.dateTime, FITBIT_DATE_FORMAT, now);

        const value = this.getQueryResultEntryValue(entry);
        if (value != null && Number.isNaN(value) === false) {
          return {
            value,
            numberedDate,
            year: DateTimeHelper.getYear(numberedDate),
            month: DateTimeHelper.getMonth(numberedDate),
            dayOfWeek: getDay(date),
          };
        } else return null;
      })
      .filter(e => e != null);
    
    return this.service.fitbitLocalDbManager.insert(this.dbTableName, entriesReady)
  }

  async fetchCyclicGroupedData(start: number, end: number, cycleType: CyclicTimeFrame): Promise<GroupedData>{
    const result = await this.service.fitbitLocalDbManager.selectQuery(makeCyclicGroupQuery(this.dbTableName, start, end, cycleType))
    return {
      data: result as any
    }
  }

  async fetchRangeGroupedData(start: number, end: number): Promise<IAggregatedValue>{
    const result = await this.service.fitbitLocalDbManager.selectQuery(makeAggregatedQuery(this.dbTableName, start, end))
    if(result.length > 0){
      return result[0] as any
    }else return null
  }
} 
