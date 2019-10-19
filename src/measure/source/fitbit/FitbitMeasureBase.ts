import {DataSourceMeasure} from '../DataSource';
import { FitbitSource } from './FitbitSource';
import { Model } from '@nozbe/watermelondb';

export abstract class FitbitMeasureBase extends DataSourceMeasure {
  protected abstract readonly scope: string;

  async activateInSystem(): Promise<boolean> {
    return this.castedSource<FitbitSource>().authenticate(this.scope);
  }

  async deactivatedInSystem(): Promise<boolean> {
    return this.castedSource<FitbitSource>().revokeScope(this.scope);
  }
}
