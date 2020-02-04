import { DataSourceType } from '../DataSourceSpec';
import { IntraDayDataSourceType } from '../../core/exploration/types';
import { GroupedData, GroupedRangeData, IAggregatedValue, IAggregatedRangeValue } from '../../core/exploration/data/types';
import { CyclicTimeFrame } from '../../core/exploration/cyclic_time';

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

  abstract async activateInSystem(): Promise<ServiceActivationResult>
  abstract async deactivatedInSystem(): Promise<boolean>

  abstract onSystemExit()

}

export enum UnSupportedReason {
  OS,
  Credential,
}
