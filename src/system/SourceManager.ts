import {DataSource, DataSourceMeasure} from '../measure/source/DataSource';
import {FitbitSource} from '../measure/source/fitbit/FitbitSource';
import {AsyncStorageHelper} from './AsyncStorageHelper';
import {MeasureSpec} from '../measure/MeasureSpec';

interface SourceSelectionInfo {
  connectedMeasureCodes: Array<string>;
  mainIndex: number;
}

class SourceManager {
  installedServices: ReadonlyArray<DataSource> = [new FitbitSource()];

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
    return AsyncStorageHelper.set(measure.spec.nameKey, selectionInfo);
  }

  async deselectSourceMeasure(measure: DataSourceMeasure): Promise<void> {
    let selectionInfo: SourceSelectionInfo = await this.getSourceSelectionInfo(
      measure.spec,
    );
    if (selectionInfo) {
      const index = selectionInfo.connectedMeasureCodes.indexOf(measure.code);
      if (index >= 0) {
        selectionInfo.connectedMeasureCodes.splice(index, 1);
        if (selectionInfo.connectedMeasureCodes.length === 0) {
            return AsyncStorageHelper.remove(measure.spec.nameKey)
        } else {
          if (selectionInfo.mainIndex === index) {
            //set another one as main
            if(selectionInfo.connectedMeasureCodes.length > index){
                selectionInfo.mainIndex = index
            }else selectionInfo.mainIndex = index - 1
          }else if(selectionInfo.mainIndex > index){
            selectionInfo.mainIndex--
          }

          await AsyncStorageHelper.set(measure.spec.nameKey, selectionInfo)
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
      const service = this.installedServices.find(s => s.name === split[0]);
      if (service) {
        return service.supportedMeasures.find(m => m.code === code);
      } else return null;
    } else return null;
  }
}

const sourceManager = new SourceManager();
export {sourceManager};
