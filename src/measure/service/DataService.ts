import { DataSourceType } from '../DataSourceSpec';
import { IntraDayDataSourceType } from '../../core/exploration/types';
import { GroupedData, GroupedRangeData, IAggregatedValue, IAggregatedRangeValue, RangeAggregatedComparisonData, FilteredDailyValues } from '../../core/exploration/data/types';
import { CyclicTimeFrame, CycleDimension, getCycleLevelOfDimension, getTimeKeyOfDimension, getCycleTypeOfDimension, getFilteredCycleDimensionList } from '../../core/exploration/cyclic_time';
import { DateTimeHelper } from '../../time';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { getNumberSequence } from '../../utils';

export interface ServiceActivationResult{
  success: boolean,
  serviceInitialDate?: number // numbered date. The date when the user first started using the service.
  error?: any
}

export abstract class DataService {
  static readonly STORAGE_PREFIX = "@source_service:"

  abstract readonly key: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly thumbnail: any;

  private supportCheckResult: {
    supported: boolean;
    reason?: UnSupportedReason;
  } = null;

  async checkSupportedInSystem(): Promise<{
    supported: boolean;
    reason?: UnSupportedReason;
  }> {
    if (this.supportCheckResult) {
      return Promise.resolve(this.supportCheckResult);
    } else {
      this.supportCheckResult = await this.onCheckSupportedInSystem();
      return this.supportCheckResult;
    }
  }

  protected abstract onCheckSupportedInSystem(): Promise<{
    supported: boolean;
    reason?: UnSupportedReason;
  }>;

  abstract isDataSourceSupported(dataSource: DataSourceType): boolean

  fetchData(dataSource: DataSourceType, start: number, end: number): Promise<any>{
    /*
    const today = DateTimeHelper.toNumberedDateFromDate(new Date())
    if(start > today) {
      return Promise.resolve(null)
    }else{
      return this.fetchDataImpl(dataSource, level, start, Math.min(end, today))
    }*/
    return this.fetchDataImpl(dataSource, start, end)
  }

  abstract fetchIntraDayData(intraDayDataSource: IntraDayDataSourceType, date: number): Promise<any>

  protected abstract fetchDataImpl(dataSource: DataSourceType, start: number, end: number): Promise<any>

  abstract fetchCyclicAggregatedData(dataSource: DataSourceType, start:number, end: number, cycle: CyclicTimeFrame): Promise<GroupedData | GroupedRangeData>

  abstract fetchRangeAggregatedData(dataSource: DataSourceType, start: number, end: number): Promise<IAggregatedValue|IAggregatedRangeValue>

  protected abstract fetchCycleRangeDimensionDataImpl(dataSource: DataSourceType, start: number, end: number, cycleDimension: CycleDimension): Promise<IAggregatedRangeValue[] | IAggregatedValue[]>
  
  async fetchCycleRangeDimensionData(dataSource: DataSourceType, start: number, end: number, cycleDimension: CycleDimension): Promise<RangeAggregatedComparisonData<IAggregatedRangeValue | IAggregatedValue>>{
    const result = await this.fetchCycleRangeDimensionDataImpl(dataSource, start, end, cycleDimension)


    const cycleLevel = getCycleLevelOfDimension(cycleDimension)
    const dimensionIndex = getTimeKeyOfDimension(cycleDimension)
    const cycleType = getCycleTypeOfDimension(cycleDimension)
    
    let timeKeySequence: Array<{timeKey: number, range: [number, number]}>
    switch(cycleLevel){
      case "year":
        timeKeySequence = getNumberSequence(DateTimeHelper.getYear(start), DateTimeHelper.getYear(end)).map(year => {

          let range: [number, number] 
          switch(cycleType){
            case CyclicTimeFrame.MonthOfYear: {
                const pivot = new Date(year, dimensionIndex-1, 1)
                range = [DateTimeHelper.toNumberedDateFromDate(startOfMonth(pivot)), DateTimeHelper.toNumberedDateFromDate(endOfMonth(pivot))]
              }
              break;
            case CyclicTimeFrame.SeasonOfYear: {
              /*
              0 => 2,3,4
              1 => 5,6,7
              2 => 8,9,10
              3 => 11,0,1
              */
              const seasonStart = new Date(year, dimensionIndex * 3 + 2, 1)
              const seasonEnd = addMonths(seasonStart, 3)
              
              range = [DateTimeHelper.toNumberedDateFromDate(startOfMonth(seasonStart)), DateTimeHelper.toNumberedDateFromDate(endOfMonth(seasonEnd))]
              console.log(range)
            } 
            break;
          }

          if(range[1] < start || range[0] > end){
            return null
          }else return {timeKey: year, range: range}
        }).filter(elm => elm != null)
        break;
    }
    
    return {
      data: timeKeySequence.map(elm => {
        const datum = (result as any).find(d => d.timeKey === elm.timeKey)
        return {range: elm.range, value: datum}
      })
    }
  }

  abstract fetchCycleDailyDimensionData(dataSource: DataSourceType, start: number, end: number, cycleDimension: CycleDimension) : Promise<FilteredDailyValues>

  abstract async activateInSystem(): Promise<ServiceActivationResult>
  abstract async deactivatedInSystem(): Promise<boolean>

  abstract onSystemExit()

}

export enum UnSupportedReason {
  OS,
  Credential,
}
