import {FitbitMeasureBase} from './FitbitMeasureBase';
import {MeasureSpec} from '../../MeasureSpec';
import {measureService, MeasureSpecKey} from '../../../system/MeasureService';
import {IWorkoutSession, IDatumBase} from '../../../database/types';
import {FitbitSource, makeFitbitDailyActivitySummaryUrl} from './FitbitSource';
import {sequenceDays} from '../../../utils';
import { FitbitActivitySummaryDay } from './types';
import moment from 'moment';

export class FitbitWorkoutMeasure extends FitbitMeasureBase {
  protected scope: string = 'activity';
  spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.workout);

  async fetchData(start: number, end: number): Promise<Array<IDatumBase>> {
    const result: Array<FitbitActivitySummaryDay> = await Promise.all(
      sequenceDays(start, end).map(day =>
        this.castedSource<FitbitSource>().fetchFitbitQuery(
          makeFitbitDailyActivitySummaryUrl(day),
        ),
      ),
    );

    const convertedList: Array<IWorkoutSession> = []

    result.forEach(dailySummary => {
      dailySummary.activities.forEach(activity => {
        if(activity.hasStartTime===true){
          const startMoment = moment(activity.startDate + "T" + activity.startTime)
        convertedList.push({
          activityType: activity.name,
          startedAt: startMoment.toDate(),
          endedAt: startMoment.add(activity.duration, 'milliseconds').toDate(),
          measureCode: this.code,
          value: null
        })
        }
      })
    })

    return convertedList
  }
}
