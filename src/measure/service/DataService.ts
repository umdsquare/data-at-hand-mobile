import { DataSourceType } from '../DataSourceSpec';
import { endOfDay, differenceInDays } from 'date-fns';
import { DataLevel } from '../../core/exploration/types';

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

  fetchData(dataSource: DataSourceType, level: DataLevel, from: Date, to: Date): Promise<any>{
    const endOfToday = endOfDay(new Date())
    if(differenceInDays(endOfToday, from) < 0){
      return Promise.resolve(null)
    }else{
      const clampedTo = differenceInDays(endOfToday, to) > 0? to : endOfToday
      return this.fetchDataImpl(dataSource, level, from, clampedTo)
    }
  }

  protected abstract fetchDataImpl(dataSource: DataSourceType, level: DataLevel, from: Date, to: Date): Promise<any>

  abstract async activateInSystem(): Promise<ServiceActivationResult>
  abstract async deactivatedInSystem(): Promise<boolean>

  abstract onSystemExit()

}

export enum UnSupportedReason {
  OS,
  Credential,
}
