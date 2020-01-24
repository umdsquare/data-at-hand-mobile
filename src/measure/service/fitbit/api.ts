import { format } from "date-fns";
import { DateTimeHelper } from "../../../time";

export const FITBIT_DATE_FORMAT = 'yyyy-MM-dd';

const FITBIT_ACTIVITY_SUMMARY_URL =
  'https://api.fitbit.com/1/user/-/activities/date/{date}.json';
const FITBIT_INTRADAY_ACTIVITY_API_URL = `https://api.fitbit.com/1/user/-/{resourcePath}/date/{date}/1d/15min/time/{startTime}/{endTime}.json`;
const FITBIT_DAY_LEVEL_ACTIVITY_API_URL = `https://api.fitbit.com/1/user/-/{resourcePath}/date/{startDate}/{endDate}.json`;

const FITBIT_SLEEP_LOGS_URL =
  'https://api.fitbit.com/1.2/user/-/sleep/date/{startDate}/{endDate}.json';

const FITBIT_WEIGHT_TREND_URL =
  'https://api.fitbit.com/1/user/-/body/weight/date/{startDate}/{endDate}.json';
  

const FITBIT_WEIGHT_LOGS_URL =
  'https://api.fitbit.com/1/user/-/body/log/weight/date/{startDate}/{endDate}.json';

const FITBIT_HEARTRATE_LOGS_URL =
  'https://api.fitbit.com/1/user/-/activities/heart/date/{date}/1d/1min/time/{startTime}/{endTime}.json';

export const FITBIT_PROFILE_URL = 'https://api.fitbit.com/1/user/-/profile.json';

/**
 *
 *
 * @param config start and end time must be within the same date
 */
export function makeFitbitIntradayActivityApiUrl(
  resourcePath: string,
  date: Date,
): string {
  const moment = require('moment');
  const stringFormat = require('string-format');
  const dateFormat = moment(date);
  return stringFormat(FITBIT_INTRADAY_ACTIVITY_API_URL, {
    resourcePath: resourcePath,
    date: dateFormat.format(FITBIT_DATE_FORMAT),
    startTime: '00:00',
    endTime: '23:59',
  });
}

export function makeFitbitSleepApiUrl(
  startDate: Date,
  endDate: Date,
): string {
  const stringFormat = require('string-format');
  return stringFormat(FITBIT_SLEEP_LOGS_URL, {
    startDate: format(startDate, FITBIT_DATE_FORMAT),
    endDate: format(endDate, FITBIT_DATE_FORMAT),
  });
}

export function makeFitbitWeightLogApiUrl(
  startDate: Date,
  endDate: Date,
): string {
  const stringFormat = require('string-format');
  return stringFormat(FITBIT_WEIGHT_LOGS_URL, {
    startDate: format(startDate, FITBIT_DATE_FORMAT),
    endDate: format(endDate, FITBIT_DATE_FORMAT),
  });
}

export function makeFitbitWeightTrendApiUrl(
  startDate: Date,
  endDate: Date,
): string {
  const stringFormat = require('string-format');
  return stringFormat(FITBIT_WEIGHT_TREND_URL, {
    startDate: format(startDate, FITBIT_DATE_FORMAT),
    endDate: format(endDate, FITBIT_DATE_FORMAT),
  });
}



export function makeFitbitHeartRateIntradayUrl(date: Date): string {
  const moment = require('moment');
  const stringFormat = require('string-format');
  return stringFormat(FITBIT_HEARTRATE_LOGS_URL, {
    date: moment(date).format(FITBIT_DATE_FORMAT),
    startTime: '00:00',
    endTime: '23:59',
  });
}

export function makeFitbitDailyActivitySummaryUrl(date: Date): string {
  const moment = require('moment');
  const stringFormat = require('string-format');
  return stringFormat(FITBIT_ACTIVITY_SUMMARY_URL, {
    date: moment(date).format(FITBIT_DATE_FORMAT),
  });
}

export function makeFitbitDayLevelActivityLogsUrl(resourcePath: string, startDate: number, endDate: number): string {
  const stringFormat = require('string-format');
  return stringFormat(FITBIT_DAY_LEVEL_ACTIVITY_API_URL, {
    resourcePath,
    startDate: DateTimeHelper.toFormattedString(startDate),
    endDate: DateTimeHelper.toFormattedString(endDate)
  })
}