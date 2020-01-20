import {measureService, MeasureSpecKey} from '../../../system/MeasureService';
import {MeasureSpec} from '../../MeasureSpec';
import {FitbitMeasureBase} from './FitbitMeasureBase';
import {FitbitService, makeFitbitIntradayActivityApiUrl} from './FitbitService';
import { IntradayStepDay } from "./types";
import { IHourlyStepBin, IDatumBase } from '../../../database/types';
import { sequenceDays } from '../../../utils';
import { startOfHour } from 'date-fns/fp';
import { toDate } from 'date-fns-tz';


export class FitbitStepMeasure extends FitbitMeasureBase {
  protected scope: string = 'activity';
  spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.step);

  async fetchData(start: number, end: number): Promise<Array<IDatumBase>> {
    const result = await Promise
      .all(sequenceDays(start, end)
      .map(day => this.castedService<FitbitService>().fetchFitbitQuery(makeFitbitIntradayActivityApiUrl("activities/steps", day))))
    
    const timeZone = await this.castedService<FitbitService>().getUserTimezone()

    const dataPoints: Array<IHourlyStepBin> = [];
    result.forEach(dayData => {
      const dateString = dayData["activities-steps"][0].dateTime;
      dayData["activities-steps-intraday"].dataset.forEach(datum => {
        const date = startOfHour(toDate(dateString + "T" + datum.time, {timeZone: timeZone}));
        if (dataPoints.length === 0 || dataPoints[dataPoints.length - 1].startedAt.getTime() != date.getTime()) {
          dataPoints.push({
            value: datum.value,
            startedAt: date,
            measureCode: this.code,
            subjectToChange: false
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
