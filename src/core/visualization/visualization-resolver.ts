import {IDatumBase, IHourlyStepBin} from '../../database/types';
import {VisualizationSchema, ChartType, DataElement} from './types';
import {DataServiceManager} from '../../system/DataServiceManager';
import {MeasureType, MeasureSpec} from '../../measure/MeasureSpec';
import {addHours} from 'date-fns';
import { MeasureSpecKey } from '../../system/MeasureService';

export function getDefaultChartType(spec: MeasureSpec): ChartType {
  switch (spec.type) {
    case MeasureType.Bin:
      return ChartType.TimeseriesBarChart;
    case MeasureType.Point:
      return ChartType.TimeseriesLineChart;
    case MeasureType.Session:
      return ChartType.SessionChart;
  }
}

export function makeDefaultChart(
  measureCode: string,
  data: Array<IDatumBase>,
  queriedDuration: {start: number, end: number}
): VisualizationSchema {
  const measure = DataServiceManager.findMeasureByCode(measureCode);
  const chartType = getDefaultChartType(measure.spec);
  switch(measure.spec.nameKey){
      case MeasureSpecKey.step:
          return {type: chartType, 
            timeFrame: queriedDuration,
            dataElements: data.map(datum => {
              const stepBin = datum as IHourlyStepBin
              return {
                  intrinsicDuration: {start: stepBin.startedAt.getTime(), end: addHours(stepBin.startedAt, 1).getTime()},
                  value: stepBin.value,
                  rawDatumIds: [] // put item id
              } as DataElement
          })}
      default: return {type: chartType, timeFrame: null, dataElements: []}
  }
  
}
