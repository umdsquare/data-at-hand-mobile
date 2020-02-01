import {format} from 'date-fns';
import {DateTimeHelper} from '../../../time';
import stringFormat from 'string-format';

export const FITBIT_DATE_FORMAT = 'yyyy-MM-dd';

const FITBIT_ACTIVITY_SUMMARY_URL =
  'https://api.fitbit.com/1/user/-/activities/date/{date}.json';
const FITBIT_INTRADAY_ACTIVITY_API_URL = `https://api.fitbit.com/1/user/-/{resourcePath}/date/{date}/1d/15min.json`;
const FITBIT_DAY_LEVEL_ACTIVITY_API_URL = `https://api.fitbit.com/1/user/-/{resourcePath}/date/{startDate}/{endDate}.json`;

const FITBIT_SLEEP_LOGS_URL =
  'https://api.fitbit.com/1.2/user/-/sleep/date/{startDate}/{endDate}.json';

const FITBIT_WEIGHT_TREND_URL =
  'https://api.fitbit.com/1/user/-/body/weight/date/{startDate}/{endDate}.json';

const FITBIT_WEIGHT_LOGS_URL =
  'https://api.fitbit.com/1/user/-/body/log/weight/date/{startDate}/{endDate}.json';

const FITBIT_HEARTRATE_LOGS_URL =
  'https://api.fitbit.com/1/user/-/activities/heart/date/{date}/1d/1min/time/{startTime}/{endTime}.json';

const FITBIT_HEARTRATE_INTRADAY_URL =
  'https://api.fitbit.com/1/user/-/activities/heart/date/{date}/1d/1min.json';

export const FITBIT_PROFILE_URL =
  'https://api.fitbit.com/1/user/-/profile.json';

/**
 *
 *
 * @param config start and end time must be within the same date
 */
export function makeFitbitIntradayActivityApiUrl(
  resourcePath: string,
  date: number,
): string {
  return stringFormat(FITBIT_INTRADAY_ACTIVITY_API_URL, {
    resourcePath: resourcePath,
    date: DateTimeHelper.toFormattedString(date),
  });
}

export function makeFitbitSleepApiUrl(
  startDate: number,
  endDate: number,
): string {
  return stringFormat(FITBIT_SLEEP_LOGS_URL, {
    startDate: DateTimeHelper.toFormattedString(startDate),
    endDate: DateTimeHelper.toFormattedString(endDate),
  });
}

export function makeFitbitHeartRateIntraDayLogApiUrl(date: number): string {
  return stringFormat(FITBIT_HEARTRATE_INTRADAY_URL, {date: DateTimeHelper.toFormattedString(date)});
}

export function makeFitbitWeightLogApiUrl(
  startDate: number,
  endDate: number,
): string {
  return stringFormat(FITBIT_WEIGHT_LOGS_URL, {
    startDate: DateTimeHelper.toFormattedString(startDate),
    endDate: DateTimeHelper.toFormattedString(endDate),
  });
}

export function makeFitbitWeightTrendApiUrl(
  startDate: number,
  endDate: number,
): string {
  return stringFormat(FITBIT_WEIGHT_TREND_URL, {
    startDate: DateTimeHelper.toFormattedString(startDate),
    endDate: DateTimeHelper.toFormattedString(endDate),
  });
}

export function makeFitbitHeartRateIntradayUrl(date: number): string {
  return stringFormat(FITBIT_HEARTRATE_LOGS_URL, {
    date: DateTimeHelper.toFormattedString(date),
    startTime: '00:00',
    endTime: '23:59',
  });
}

export function makeFitbitDailyActivitySummaryUrl(date: number): string {
  return stringFormat(FITBIT_ACTIVITY_SUMMARY_URL, {
    date: DateTimeHelper.toFormattedString(date),
  });
}

export function makeFitbitDayLevelActivityLogsUrl(
  resourcePath: string,
  startDate: number,
  endDate: number,
): string {
  return stringFormat(FITBIT_DAY_LEVEL_ACTIVITY_API_URL, {
    resourcePath,
    startDate: DateTimeHelper.toFormattedString(startDate),
    endDate: DateTimeHelper.toFormattedString(endDate),
  });
}
