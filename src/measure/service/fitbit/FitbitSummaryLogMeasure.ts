import { DateTimeHelper } from '@utils/time';
import { parse, getDay } from 'date-fns';
import { FITBIT_DATE_FORMAT } from './api';
import { FitbitRangeMeasure } from './FitbitRangeMeasure';
import { FitbitLocalTableName, makeCyclicGroupQuery, makeAggregatedQuery, makeCycleDimensionRangeQuery } from './sqlite/database';
import { SQLiteHelper } from '@utils/sqlite-helper';
import { GroupedData, IAggregatedValue, GroupedRangeData, FilteredDailyValues, BoxPlotInfo } from '@core/exploration/data/types';
import { CyclicTimeFrame, CycleDimension, getCycleTypeOfDimension, getTimeKeyOfDimension } from '@core/exploration/cyclic_time';

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

  protected shouldReject(rowValue: number): boolean { return false }

  protected getBoxPlotInfoOfDatasetFromDb(): Promise<BoxPlotInfo> {
    return this.service.core.fitbitLocalDbManager.getBoxplotInfo(this.dbTableName)
  }

  async fetchPreliminaryData(
    startDate: number,
    endDate: number,
    includeStatistics: boolean
  ): Promise<{
    list: Array<any>;
    avg: number;
    min: number;
    max: number;
    sum: number;
    valueRange: [number, number]
  }> {

    const condition = "`numberedDate` BETWEEN ? AND ? ORDER BY `numberedDate`"
    const params = [startDate, endDate]
    const list = await this.service.core.fitbitLocalDbManager.fetchData(this.dbTableName, condition, params)

    const boxPlotInfo = await this.getBoxPlotInfoOfDataset()
    /*
        const filtered = this.service.realm
          .objects<RealmEntryClassType>(this.realmEntryClassType)
          .filtered(this.getLocalRangeQueryCondition(startDate, endDate))
          .sorted('numberedDate');
    
        const avg = filtered.avg('value') as number;
        const min = filtered.min('value') as number;
        const max = filtered.max('value') as number;
        const sum = filtered.sum('value') as number;*/
    let statistics
    if (includeStatistics === true) {
      statistics = await this.service.core.fitbitLocalDbManager.getAggregatedValue(this.dbTableName, [
        {type: SQLiteHelper.AggregationType.AVG, aggregatedColumnName: 'value', as: 'avg'},
        {type: SQLiteHelper.AggregationType.MIN, aggregatedColumnName: 'value', as: 'min'},
        {type: SQLiteHelper.AggregationType.MAX, aggregatedColumnName: 'value', as: 'max'},
        {type: SQLiteHelper.AggregationType.SUM, aggregatedColumnName: 'value', as: 'sum'},
      ], condition, params)
    }

    return Promise.resolve({
      list,
      avg: statistics != null ? statistics['avg'] : null,
      min: statistics != null ? statistics['min'] : null,
      max: statistics != null ? statistics['max'] : null,
      sum: statistics != null ? statistics['sum'] : null,
      valueRange: [boxPlotInfo.minWithoutOutlier, boxPlotInfo.maxWithoutOutlier]
    });
  }

  async  fetchTodayValue(): Promise<number> {
    const today = DateTimeHelper.toNumberedDateFromDate(this.service.core.getToday());

    const todayResult = await this.service.core.fitbitLocalDbManager.fetchData(this.dbTableName, "`numberedDate` = ?", [today])

    return todayResult.length > 0 ? todayResult[0]['value'] : null;
  }

  //abstract formatTodayValue(value: number): Array<{text: string, type: 'unit'|'value'}>

  protected async handleQueryResultEntry(entries: any[], now: Date) {
    const entriesReady = entries
      .map(entry => {
        const numberedDate = DateTimeHelper.fromFormattedString(entry.dateTime);
        const date = parse(entry.dateTime, FITBIT_DATE_FORMAT, now);

        const value = this.getQueryResultEntryValue(entry);
        if (value != null && Number.isNaN(value) === false && this.shouldReject(value) === false) {
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

    return this.service.core.fitbitLocalDbManager.insert(this.dbTableName, entriesReady)
  }

  async fetchCyclicGroupedData(start: number, end: number, cycleType: CyclicTimeFrame): Promise<GroupedData> {
    const result = await this.service.core.fitbitLocalDbManager.selectQuery(makeCyclicGroupQuery(this.dbTableName, start, end, cycleType))
    return {
      data: result as any
    }
  }

  async fetchRangeGroupedData(start: number, end: number): Promise<IAggregatedValue> {
    const result = await this.service.core.fitbitLocalDbManager.selectQuery(makeAggregatedQuery(this.dbTableName, start, end))
    if (result.length > 0) {
      return result[0] as any
    } else return null
  }

  async fetchCycleRangeDimensionData(start: number, end: number, cycleDimension: CycleDimension): Promise<IAggregatedValue[]> {
    const result = await this.service.core.fitbitLocalDbManager.selectQuery<IAggregatedValue>(makeCycleDimensionRangeQuery(this.dbTableName, start, end, cycleDimension))
    return result
  }

  async fetchCycleDailyDimensionData(start: number, end: number, cycleDimension: CycleDimension): Promise<FilteredDailyValues> {
    let condition = "`numberedDate` BETWEEN ? AND ?"

    const cycleType = getCycleTypeOfDimension(cycleDimension)
    switch (cycleType) {
      case CyclicTimeFrame.DayOfWeek:
        condition += " AND `dayOfWeek` = " + getTimeKeyOfDimension(cycleDimension)
        break;
    }

    condition += " ORDER BY `numberedDate`"
    const params = [start, end]


    const list = await this.service.core.fitbitLocalDbManager.fetchData<{ numberedDate: number, value: number }>(this.dbTableName, condition, params)

    return {
      type: 'length',
      data: list
    }
  }
} 
