import {FitbitService, makeFitbitIntradayActivityApiUrl, makeFitbitDayLevelActivityLogsUrl, FITBIT_DATE_FORMAT} from './FitbitService';
import { IntradayStepDay, FitbitDailyActivityStepsQueryResult } from "./types";
import { IHourlyStepBin, IDatumBase, DailySummaryDatum } from '../../../database/types';
import { sequenceDays } from '../../../utils';
import { startOfHour } from 'date-fns/fp';
import { toDate } from 'date-fns-tz';
import { DataServiceMeasure } from '../DataService';
import { parse, isSameDay, isAfter } from 'date-fns';
import { DateTimeHelper } from '../../../time';


export class FitbitDailyStepMeasure extends DataServiceMeasure {
  
  async fetchData(startDate: Date, endDate: Date): Promise<IDatumBase[]> {
    
    const result: FitbitDailyActivityStepsQueryResult = await this.castedService<FitbitService>().fetchFitbitQuery(makeFitbitDayLevelActivityLogsUrl("activities/steps", startDate, endDate))
    const timeZone = await this.castedService<FitbitService>().getUserTimezone()
    
    const data = result["activities-steps"].map(entry => {

      const date = toDate(entry.dateTime, { timeZone })
      const now = new Date()
      return {
        value: Number.parseInt(entry.value),
        numberedDate: DateTimeHelper.fromFormattedString(entry.dateTime),
        subjectToChange: isSameDay(now, date) || isAfter(date, now)
      } as DailySummaryDatum
    })

    return data
  }


  /*
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
  }*/
}
