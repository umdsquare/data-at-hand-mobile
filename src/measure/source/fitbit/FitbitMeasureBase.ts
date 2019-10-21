import {DataSourceMeasure} from '../DataSource';
import {FitbitSource} from './FitbitSource';

export abstract class FitbitMeasureBase extends DataSourceMeasure {
  protected abstract readonly scope: string;

  async activateInSystem(): Promise<boolean> {
    try {
      const accessToken = await this.castedSource<FitbitSource>().authenticate(
        this.scope,
      );
      if(accessToken!=null){
        return true
      }else return false
    } catch (ex) {
      console.log(ex)
      return false
    }
  }

  async deactivatedInSystem(): Promise<boolean> {
    return this.castedSource<FitbitSource>().revokeScope(this.scope);
  }
}
