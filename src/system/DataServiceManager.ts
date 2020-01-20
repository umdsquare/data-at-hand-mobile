import {DataService, DataMeasure} from '../measure/service/DataService';
import {FitbitService} from '../measure/service/fitbit/FitbitService';
import {MeasureSpec} from '../measure/MeasureSpec';
import {AppleHealthService} from '../measure/service/healthkit/AppleHealthService';
import {measureService} from './MeasureService';
import { SettingsState } from '../state/settings/reducer';

class DataServiceManager {
  installedServices: ReadonlyArray<DataService> = [
    new FitbitService(),
    new AppleHealthService(),
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

  getMeasuresOfService(
    service: DataService,
  ): Array<DataMeasure> {
    return measureService.supportedMeasureSpecs.map(spec =>
      service.getMeasureOfSpec(spec)
    )
  }

  getServiceByKey(serviceKey: string): DataService{
    return this.installedServices.find(s => s.key === serviceKey)
  }

  findMeasureByCode(code: string): DataMeasure {
    const split = code.split(':');
    if (split.length >= 2) {
      const service = this.installedServices.find(s => s.key === split[0]);
      if (service) {
        return service.supportedMeasures.find(m => m.code === code);
      } else return null;
    } else return null;
  }

  getDataMeasureOfSpec(spec: MeasureSpec, state: SettingsState): DataMeasure{
    return this.findMeasureByCode(state.serviceKey + ":" + spec.nameKey)
  }
/*
  getMainSourceMeasure(spec: MeasureSpec, state: SettingsState): DataMeasure{
    const info = state.selectionInfoList.find(info => info.measureSpecKey === spec.nameKey)
    if(info){
      const {connectedMeasureCodes, mainIndex} = info.sourceSelectionInfo
      if(connectedMeasureCodes && mainIndex >= 0){
        return this.findMeasureByCode(connectedMeasureCodes[mainIndex])
      }else return null
    }else return null
  }*/
}

const dataServiceManager = new DataServiceManager();
export {dataServiceManager as DataServiceManager};
