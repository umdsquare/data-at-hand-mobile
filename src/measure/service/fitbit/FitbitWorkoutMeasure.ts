import {FitbitMeasureBase} from './FitbitMeasureBase';
import {MeasureSpec} from '../../MeasureSpec';
import {measureService, MeasureSpecKey} from '../../../system/MeasureService';
import {IWorkoutSession, IDatumBase} from '../../../database/types';
import {FitbitService, makeFitbitDailyActivitySummaryUrl} from './FitbitService';
import {sequenceDays} from '../../../utils';
import {FitbitActivitySummaryDay} from './types';
import {toDate} from 'date-fns-tz';
import {addMilliseconds} from 'date-fns';

export class FitbitWorkoutMeasure extends FitbitMeasureBase {
  protected scope: string = 'activity';
  spec: MeasureSpec = measureService.getSpec(MeasureSpecKey.workout);

  async fetchData(start: number, end: number): Promise<Array<IDatumBase>> {
    const result: Array<FitbitActivitySummaryDay> = await Promise.all(
      sequenceDays(start, end).map(day =>
        this.castedService<FitbitService>().fetchFitbitQuery(
          makeFitbitDailyActivitySummaryUrl(day),
        ),
      ),
    );

    const timeZone = await this.castedService<FitbitService>().getUserTimezone();

    const convertedList: Array<IWorkoutSession> = [];

    result.forEach(dailySummary => {
      dailySummary.activities.forEach(activity => {
        if (activity.hasStartTime === true) {
          const startedAt = toDate(
            activity.startDate + 'T' + activity.startTime,
            {timeZone: timeZone},
          );
          convertedList.push({
            activityType: activity.name,
            startedAt: startedAt,
            endedAt: addMilliseconds(startedAt, activity.duration),
            duration: activity.duration,
            measureCode: this.code,
            value: null,
            subjectToChange: false
          });
        }
      });
    });

    return convertedList;
  }
}
