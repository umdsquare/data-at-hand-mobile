import { IDatumBase, DataLevel } from '../../database/types';
import { DataSourceSpec, DataSourceType } from '../DataSourceSpec';
import { isAfter, endOfDay, differenceInDays } from 'date-fns';

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

  fetchData(dataSource: DataSourceType, level: DataLevel, from: Date, to: Date): Promise<Array<IDatumBase>>{
    const endOfToday = endOfDay(new Date())
    if(differenceInDays(endOfToday, from) < 0){
      return Promise.resolve([])
    }else{
      const clampedTo = differenceInDays(endOfToday, to) > 0? to : endOfToday
      return this.fetchDataImpl(dataSource, level, from, clampedTo)
    }
  }

  protected abstract fetchDataImpl(dataSource: DataSourceType, level: DataLevel, from: Date, to: Date): Promise<Array<IDatumBase>>

  abstract async activateInSystem(): Promise<boolean>
  abstract async deactivatedInSystem(): Promise<boolean>

}

export abstract class DataServiceMeasure{

  constructor(readonly source: DataService) {}

  castedService<T extends DataService>(): T{ return this.source as T}
  
  abstract fetchData(startDate: Date, endDate: Date): Promise<Array<IDatumBase>>
}

export enum UnSupportedReason {
  OS,
  Credential,
}
