import {MeasureSpec} from '../MeasureSpec';

export abstract class DataSource {
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

  abstract readonly supportedMeasures: ReadonlyArray<DataSourceMeasure>;

  getMeasureOfType(typeKey: string): DataSourceMeasure {
    return this.supportedMeasures.find(m => m.spec.type == typeKey);
  }

  getMeasureOfSpec(spec: MeasureSpec): DataSourceMeasure {
    return this.supportedMeasures.find(m => m.spec.nameKey === spec.nameKey);
  }
}

export abstract class DataSourceMeasure {
  abstract readonly spec: MeasureSpec;

  get code(): string{ return this.source.key + ":" + this.spec.nameKey}

  protected castedSource<T extends DataSource>(): T {
    return this.source as T;
  }

  constructor(readonly source: DataSource) {}

  abstract async activateInSystem(): Promise<boolean>
  abstract async deactivatedInSystem(): Promise<boolean>
  
}

export enum UnSupportedReason {
  OS,
  Credential,
}
