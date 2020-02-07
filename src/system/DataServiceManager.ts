import {DataService} from '../measure/service/DataService';
import {FitbitService} from '../measure/service/fitbit/FitbitService';

class DataServiceManager {
  installedServices: ReadonlyArray<DataService> = [
    new FitbitService(),
  ];

  private _supportedServices: ReadonlyArray<DataService> = null;

  async getServicesSupportedInThisSystem(): Promise<ReadonlyArray<DataService>> {
    if (this._supportedServices == null) {
      const list = [];
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

  getServiceByKey(serviceKey: string): DataService{
    return this.installedServices.find(s => s.key === serviceKey)
  }
}

const dataServiceManager = new DataServiceManager();
export {dataServiceManager as DataServiceManager};
