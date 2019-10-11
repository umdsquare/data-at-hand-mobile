import {DataSource, DataSourceMeasure} from '../measure/source/DataSource';
import {FitbitSource} from '../measure/source/fitbit/FitbitSource';
import {AsyncStorageHelper} from './AsyncStorageHelper';
import {MeasureSpec} from '../measure/MeasureSpec';
import {AppleHealthSource} from '../measure/source/healthkit/AppleHealthSource';
import {Subject, Observable} from 'rxjs';

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

  readonly _onSelectedSourceChanged = new Subject<void>();
  get onSelectedSourceChanged(): Observable<void> {
    return this._onSelectedSourceChanged;
  }

  async selectSourceMeasure(
    measure: DataSourceMeasure,
    setMainIfNot: boolean,
  ): Promise<void> {
    let selectionInfo: SourceSelectionInfo = await this.getSourceSelectionInfo(
      measure.spec,
    );
    if (selectionInfo) {
      const selectedIndex = selectionInfo.connectedMeasureCodes.indexOf(
        measure.code,
      );
      if (selectedIndex >= 0) {
        if (setMainIfNot === true) {
          selectionInfo.mainIndex = selectedIndex;
        }
      } else {
        selectionInfo.connectedMeasureCodes.push(measure.code);
        if (setMainIfNot === true) {
          selectionInfo.mainIndex =
            selectionInfo.connectedMeasureCodes.length - 1;
        }
      }
    } else {
      selectionInfo = {
        connectedMeasureCodes: [measure.code],
        mainIndex: 0,
      };
    }
    return AsyncStorageHelper.set(measure.spec.nameKey, selectionInfo).then(
      () => {
        this._onSelectedSourceChanged.next();
      },
    );
  }

  async deselectSourceMeasure(measure: DataSourceMeasure): Promise<void> {
    let selectionInfo: SourceSelectionInfo = await this.getSourceSelectionInfo(
      measure.spec,
    );
    if (selectionInfo) {
      const index = selectionInfo.connectedMeasureCodes.indexOf(measure.code);
      if (index >= 0) {
        const deactivated = await measure.deactivatedInSystem();
        if (deactivated === true) {
        
          selectionInfo.connectedMeasureCodes.splice(index, 1);
          if (selectionInfo.connectedMeasureCodes.length === 0) {
            return AsyncStorageHelper.remove(measure.spec.nameKey).then(() => {
              this._onSelectedSourceChanged.next();
            });
          } else {
            if (selectionInfo.mainIndex === index) {
              //set another one as main
              if (selectionInfo.connectedMeasureCodes.length > index) {
                selectionInfo.mainIndex = index;
              } else selectionInfo.mainIndex = index - 1;
            } else if (selectionInfo.mainIndex > index) {
              selectionInfo.mainIndex--;
            }

            await AsyncStorageHelper.set(measure.spec.nameKey, selectionInfo);
            this._onSelectedSourceChanged.next();
          }
        }
      }
    } else return;
  }

  async getSourceSelectionInfo(
    measureSpec: MeasureSpec,
  ): Promise<SourceSelectionInfo> {
    return await AsyncStorageHelper.getObject(measureSpec.nameKey);
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
}

const sourceManager = new SourceManager();
export {sourceManager};
