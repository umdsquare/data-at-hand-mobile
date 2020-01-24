import {ExplorationInfo, ExplorationType, ParameterType, DataLevel} from '../types';
import {OverviewData} from './types';
import {explorationCommandResolver} from '../ExplorationCommandResolver';
import {DateTimeHelper} from '../../../time';
import {dataSourceManager} from '../../../system/DataSourceManager';
import {DataServiceManager} from '../../../system/DataServiceManager';

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
        break;
      case ExplorationType.B_Day:
        break;
      default:
        Promise.reject({error: 'Unsupported exploration type.'});
    }
  }

  private loadOverviewData(
    info: ExplorationInfo,
    selectedServiceKey: string,
  ): Promise<OverviewData> {
    const range = explorationCommandResolver.getParameterValue(
      info,
      ParameterType.Range,
    );
    const rangeStartDate = DateTimeHelper.toDate(range[0]);
    const rangeEndDate = DateTimeHelper.toDate(range[1]);

    const selectedService = DataServiceManager.getServiceByKey(
      selectedServiceKey,
    );
    
    return Promise.all(
      dataSourceManager.supportedDataSources.map(source =>
        selectedService.fetchData(source.type, DataLevel.DailyActivity, rangeStartDate, rangeEndDate)
            .then(result => result != null? result : {source: source.type})
    )).then(dataPerSource => ({sourceDataList: dataPerSource}));
  }
}

const resolver = new ExplorationDataResolver();

export {resolver as explorationDataResolver};
