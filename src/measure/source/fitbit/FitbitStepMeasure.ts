import {measureService, MeasureSpecKey} from '../../../system/MeasureService';
import {MeasureSpec} from '../../MeasureSpec';
import {FitbitMeasureBase} from './FitbitMeasureBase';
import {FitbitSource, makeFitbitIntradayActivityApiUrl} from './FitbitSource';
import { IntradayStepDay } from "./types";
import moment from 'moment';
import { IHourlyStepBin, IDatumBase } from '../../../database/types';
import { sequenceDays } from '../../../utils';

export class FitbitStepMeasure extends FitbitMeasureBase {
  protected scope: string = 'activity';
  spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.step);

  async fetchData(start: number, end: number): Promise<Array<IDatumBase>> {
    const result = await Promise
      .all(sequenceDays(start, end)
      .map(day => this.castedSource<FitbitSource>().fetchFitbitQuery(makeFitbitIntradayActivityApiUrl("activities/steps", day))))
    
    const dataPoints: Array<IHourlyStepBin> = [];
    result.forEach(dayData => {
      const dateString = dayData["activities-steps"][0].dateTime;
      dayData["activities-steps-intraday"].dataset.forEach(datum => {
        const date = moment(dateString + "T" + datum.time).startOf("hour").toDate();
        if (dataPoints.length === 0 || dataPoints[dataPoints.length - 1].startedAt.getTime() != date.getTime()) {
          dataPoints.push({
            value: datum.value,
            startedAt: date,
            measureCode: this.code
          });
        }
        else {
          dataPoints[dataPoints.length - 1].value += datum.value;
        }
      });
    });
    return dataPoints;
  }
}
