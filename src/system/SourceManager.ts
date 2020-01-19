import {DataService, DataSourceMeasure} from '../measure/source/DataService';
import {FitbitSource} from '../measure/source/fitbit/FitbitSource';
import {MeasureSpec} from '../measure/MeasureSpec';
import {AppleHealthSource} from '../measure/source/healthkit/AppleHealthSource';
import {measureService} from './MeasureService';
import { SettingsState } from '../state/settings/reducer';

class SourceManager {
  installedServices: ReadonlyArray<DataService> = [
    new FitbitSource(),
    new AppleHealthSource(),
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

  getSourcesOfService(
    service: DataService,
  ): Array<DataSourceMeasure> {
    return measureService.supportedMeasureSpecs.map(spec =>
      service.getMeasureOfSpec(spec)
    )
  }

  getServiceByKey(serviceKey: string): DataService{
    return this.installedServices.find(s => s.key === serviceKey)
  }

  findSourceByCode(code: string): DataSourceMeasure {
    const split = code.split(':');
    if (split.length >= 2) {
      const service = this.installedServices.find(s => s.key === split[0]);
      if (service) {
        return service.supportedMeasures.find(m => m.code === code);
      } else return null;
    } else return null;
  }

  getDataSourceOfSpec(spec: MeasureSpec, state: SettingsState): DataSourceMeasure{
    return this.findSourceByCode(state.serviceKey + ":" + spec.nameKey)
  }
/*
  getMainSourceMeasure(spec: MeasureSpec, state: SettingsState): DataSourceMeasure{
    const info = state.selectionInfoList.find(info => info.measureSpecKey === spec.nameKey)
    if(info){
      const {connectedMeasureCodes, mainIndex} = info.sourceSelectionInfo
      if(connectedMeasureCodes && mainIndex >= 0){
        return this.findMeasureByCode(connectedMeasureCodes[mainIndex])
      }else return null
    }else return null
  }*/
}

const sourceManager = new SourceManager();
export {sourceManager};
