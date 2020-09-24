import { DataService } from '@measure/service/DataService';

export class DataServiceManager {

  private static _instance: DataServiceManager

  static get instance(): DataServiceManager {
    if (this._instance == null) {
      this._instance = new DataServiceManager()
    }
    return this._instance
  }


  private readonly installedServices: ReadonlyArray<DataService> 

  private _supportedServices: ReadonlyArray<DataService> | null = null;

  private constructor() {

    const FitbitService = require('@measure/service/fitbit/FitbitService').default
    const FitbitOfficialServiceCore = require('@measure/service/fitbit/core/FitbitOfficialServiceCore').default
    const AppleHealthService = require('@measure/service/healthkit/AppleHealthService').default
    
    //const AppleHealthService = require('@measure/service/healthkit/AppleHealthService').default
    
    this.installedServices = [
      new FitbitService(new FitbitOfficialServiceCore()),
      new AppleHealthService()
    ];
  }

  async getServicesSupportedInThisSystem(): Promise<ReadonlyArray<DataService>> {
    if (this._supportedServices == null) {
      const list: Array<DataService> = [];
      for (let i = 0; i < this.installedServices.length; i++) {
        const result = await this.installedServices[i].checkSupportedInSystem();
        if (result.supported === true) {
          list.push(this.installedServices[i]);
        }
      }

      this._supportedServices = list;
    }
    return this._supportedServices;
  }

  getServiceByKey(serviceKey: string): DataService {
    return this.installedServices.find(s => s.key === serviceKey)!
  }
}