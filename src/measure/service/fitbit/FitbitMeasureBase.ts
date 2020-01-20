import {DataMeasure} from '../DataService';
import {FitbitService} from './FitbitService';

export abstract class FitbitMeasureBase extends DataMeasure {
  protected abstract readonly scope: string;

  async activateInSystem(): Promise<boolean> {
    try {
      const accessToken = await this.castedService<FitbitService>().authenticate(
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
    return this.castedService<FitbitService>().revokeScope(this.scope);
  }
}
