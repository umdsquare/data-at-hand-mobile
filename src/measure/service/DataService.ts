import {MeasureSpec} from '../MeasureSpec';
import { IDatumBase } from '../../database/types';

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

  abstract readonly supportedMeasures: ReadonlyArray<DataMeasure>;

  getMeasureOfType(typeKey: string): DataMeasure {
    return this.supportedMeasures.find(m => m.spec.type == typeKey);
  }

  getMeasureOfSpec(spec: MeasureSpec): DataMeasure {
    return this.supportedMeasures.find(m => m.spec.nameKey === spec.nameKey);
  }
}

export abstract class DataMeasure {
  abstract readonly spec: MeasureSpec;

  get code(): string{ return this.source.key + ":" + this.spec.nameKey}

  protected castedService<T extends DataService>(): T {
    return this.source as T;
  }

  constructor(readonly source: DataService) {}

  abstract async activateInSystem(): Promise<boolean>
  abstract async deactivatedInSystem(): Promise<boolean>
  
  abstract fetchData(start: number, end: number): Promise<Array<IDatumBase>>
}

export enum UnSupportedReason {
  OS,
  Credential,
}
