import {ExplorationInfo, ExplorationType, ParameterType, DataLevel} from '../types';
import {OverviewData, OverviewSourceRow} from './types';
import {explorationInfoHelper} from '../ExplorationInfoHelper';
import {DateTimeHelper} from '../../../time';
import {dataSourceManager} from '../../../system/DataSourceManager';
import {DataServiceManager} from '../../../system/DataServiceManager';
import { DataSourceType } from '../../../measure/DataSourceSpec';

class ExplorationDataResolver {
  loadData(
    explorationInfo: ExplorationInfo,
    prevInfo: ExplorationInfo,
    selectedServiceKey: string,
    prevData?: any,
  ): Promise<any> {
    switch (explorationInfo.type) {
      case ExplorationType.B_Ovrvw:
        return this.loadOverviewData(explorationInfo, selectedServiceKey);
      case ExplorationType.B_Range:
        return this.loadBrowseRangeData(explorationInfo, selectedServiceKey)
      case ExplorationType.B_Day:
        return this.loadIntraDayData(explorationInfo, selectedServiceKey)
      default:
        Promise.reject({error: 'Unsupported exploration type.'});
    }
  }

  private loadBrowseRangeData(info: ExplorationInfo, selectedServiceKey: string): Promise<OverviewSourceRow>{
    const range = explorationInfoHelper.getParameterValue(
      info,
      ParameterType.Range,
    );
    const source = explorationInfoHelper.getParameterValue<DataSourceType>(info, ParameterType.DataSource)

    const selectedService = DataServiceManager.getServiceByKey(
      selectedServiceKey,
    );
    
    return selectedService.fetchData(source, DataLevel.DailyActivity, range[0], range[1])
  }

  private loadOverviewData(
    info: ExplorationInfo,
    selectedServiceKey: string,
  ): Promise<OverviewData> {
    const range = explorationInfoHelper.getParameterValue(
      info,
      ParameterType.Range,
    );

    const selectedService = DataServiceManager.getServiceByKey(
      selectedServiceKey,
    );
    
    return Promise.all(
      dataSourceManager.supportedDataSources.map(source =>
        selectedService.fetchData(source.type, DataLevel.DailyActivity, range[0], range[1])
            .then(result => result != null? result : {source: source.type})
    )).then(dataPerSource => ({sourceDataList: dataPerSource}));
  }

  private loadIntraDayData(
    info: ExplorationInfo,
    selectedServiceKey: string
  ): Promise<any>{

    const selectedService = DataServiceManager.getServiceByKey(
      selectedServiceKey,
    );
    const source = explorationInfoHelper.getParameterValue<DataSourceType>(info, ParameterType.DataSource)
    const date = explorationInfoHelper.getParameterValue<number>(info, ParameterType.Date)

    return selectedService.fetchData(source, DataLevel.IntraDay, date, date)
  }
}

const resolver = new ExplorationDataResolver();

export {resolver as explorationDataResolver};
