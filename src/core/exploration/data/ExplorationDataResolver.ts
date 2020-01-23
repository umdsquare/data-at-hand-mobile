import {ExplorationInfo, ExplorationType, ParameterType, DataLevel} from '../types';
import {OverviewData, OverviewSourceRow} from './types';
import {explorationCommandResolver} from '../ExplorationCommandResolver';
import {DateTimeHelper} from '../../../time';
import {dataSourceManager} from '../../../system/DataSourceManager';
import {DataServiceManager} from '../../../system/DataServiceManager';
import {DataSourceType} from '../../../measure/DataSourceSpec';
import * as d3 from 'd3-array';
import commaNumber from 'comma-number';

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

    const today = new Date();
    return Promise.all(
      dataSourceManager.supportedDataSources.map(source =>
        selectedService
          .fetchData(
            source.type,
            DataLevel.DailyActivity,
            rangeStartDate,
            rangeEndDate,
          )
          .then(list =>
            selectedService
              .fetchData(source.type, DataLevel.DailyActivity, today, today)
              .then(todayData => {
                const base = {
                  source: source.type,
                  list: list,
                } as OverviewSourceRow;

                if (todayData.length > 0) {
                    const todayValue = todayData[0].value
                    const values = list.map(elm => elm.value).filter(v => Number.isNaN(v) !== true && v > 25)
                  switch (source.type) {
                    case DataSourceType.StepCount:
                      base.today = {
                        label: 'Today',
                        value: todayValue,
                        formatted: todayValue? [
                          {
                            text: commaNumber(todayValue),
                            type: 'value',
                          },
                          {text: ' steps', type: 'unit'},
                        ] : [{text: "No value", type:'value'}],
                      };

                      base.statistics = [
                          {
                              label: 'Avg. ',
                              valueText: commaNumber(Math.round(d3.mean(values)))
                          },
                          {
                              label: 'Total ',
                              valueText: commaNumber(d3.sum(values))
                          },
                          {
                              label: 'Range ',
                              valueText: commaNumber(d3.min(values)) + " - " + commaNumber(d3.max(values))
                          }
                      ]
                      break;
                    case DataSourceType.HeartRate:
                      base.today = {
                        label: 'Today',
                        value: todayValue,
                        formatted: todayValue? [
                          {
                            text: todayValue.toString(),
                            type: 'value',
                          },
                          {
                            text: ' bpm',
                            type: 'unit',
                          },
                        ] : [{text: "No value", type: "value"}],
                      };

                      base.statistics = [
                        {
                          label: 'Avg. ',
                          valueText: Math.round(
                            d3.mean(values),
                          ).toString() + " bpm",
                        },
                        {
                            label: 'Range ',
                            valueText: d3.min(values) + " - " + d3.max(values)
                        }
                      ];
                      break;
                  }
                }

                return base;
              }),
          ),
      ),
    ).then(dataPerSource => ({sourceDataList: dataPerSource}));
  }
}

const resolver = new ExplorationDataResolver();

export {resolver as explorationDataResolver};
