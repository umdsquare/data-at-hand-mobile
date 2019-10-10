import {MeasureSpec} from '../MeasureSpec';

export abstract class DataSource {
  abstract readonly name: string;
  abstract readonly description: string;

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

  protected castedSource<T extends DataSource>(): T {
    return this.source as T;
  }

  constructor(readonly source: DataSource) {}
}

export enum UnSupportedReason {
  OS,
  Credential,
}
