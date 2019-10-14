import {DataSource, DataSourceMeasure} from '../measure/source/DataSource';
import {FitbitSource} from '../measure/source/fitbit/FitbitSource';
import {AsyncStorageHelper} from './AsyncStorageHelper';
import {MeasureSpec} from '../measure/MeasureSpec';
import {AppleHealthSource} from '../measure/source/healthkit/AppleHealthSource';
import {Subject, Observable} from 'rxjs';
import {measureService} from './MeasureService';
import {MeasureSettingsScreen} from '../components/pages/sources/MeasureSettingsScreen';
import { MeasureSettingsState } from '../state/measure-settings/reducer';

export interface SourceSelectionInfo {
  connectedMeasureCodes: Array<string>;
  mainIndex: number;
}

class SourceManager {
  installedServices: ReadonlyArray<DataSource> = [
    new FitbitSource(),
    new AppleHealthSource(),
  ];

  private _supportedServices: ReadonlyArray<DataSource> = null;

  async getServicesSupportedInThisSystem(): Promise<ReadonlyArray<DataSource>> {
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
  
  async getSourceSelectionInfo(
    measureSpec: MeasureSpec,
  ): Promise<SourceSelectionInfo> {
    return await AsyncStorageHelper.getObject(measureSpec.nameKey);
  }

  getSelectedMeasuresOfSource(
    source: DataSource,
  ): Promise<Array<DataSourceMeasure>> {
    return Promise.all(
      measureService.supportedMeasureSpecs.map(spec =>
        this.getSourceSelectionInfo(spec).then(info => {
          if (info != null && info.connectedMeasureCodes) {
            return info.connectedMeasureCodes
              .map(code => this.findMeasureByCode(code))
              .filter(measure => measure.source.key === source.key);
          } else return [];
        })
      )
    ).then(resultMatrix => {
        const result = []
        resultMatrix.forEach(r => {
            r.forEach(m => {
                result.push(m)
            })
        })
        return result
    })
  }

  findMeasureByCode(code: string): DataSourceMeasure {
    const split = code.split(':');
    if (split.length >= 2) {
      const service = this.installedServices.find(s => s.key === split[0]);
      if (service) {
        return service.supportedMeasures.find(m => m.code === code);
      } else return null;
    } else return null;
  }

  getMainSourceMeasure(spec: MeasureSpec, state: MeasureSettingsState): DataSourceMeasure{
    const info = state.selectionInfoList.find(info => info.measureSpecKey === spec.nameKey)
    if(info){
      const {connectedMeasureCodes, mainIndex} = info.sourceSelectionInfo
      if(connectedMeasureCodes && mainIndex >= 0){
        return this.findMeasureByCode(connectedMeasureCodes[mainIndex])
      }else return null
    }else return null
  }
}

const sourceManager = new SourceManager();
export {sourceManager};
