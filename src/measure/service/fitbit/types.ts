export interface FitbitUserProfile{
  user: {
    age: number,
    fullName: string,
    dateOfBirth: string,
    timezone: string
  }
}

export interface IntradayStepDay {
  'activities-steps': [{dateTime: string; value: string}];
  'activities-steps-intraday': {
    dataset: Array<{time: string; value: number}>;
  };
}

export interface FitbitSleepQueryResult {
  sleep: Array<{
    dateOfSleep: string;
    endTime: string;
    startTime: string;
    efficiency: number;
    duration: number;
    logId: number;
  }>;
}

export interface FitbitDailyActivityStepsQueryResult{
  "activities-steps": Array<{
    dateTime: string,
    value: string
  }>
}

/*
{
      "dateOfSleep": "2019-10-18",
      "duration": 26220000,
      "efficiency": 93,
      "endTime": "2019-10-18T08:07:30.000",
      "infoCode": 0,
      "isMainSleep": true,
      "levels": [Object],
      "logId": 24307047175,
      "minutesAfterWakeup": 24,
      "minutesAsleep": 370,
      "minutesAwake": 67,
      "minutesToFallAsleep": 0,
      "startTime": "2019-10-18T00:50:30.000",
      "timeInBed": 437,
      "type": "stages"
    },
*/

export interface FitbitActivitySummaryDay {
  activities: Array<{
    activityId: number;
    activityParentId: number;
    activityParentName: string;
    calories: number;
    description: string;
    duration: number;
    hasStartTime: boolean;
    isFavorite: boolean;
    lastModified: string;
    logId: number;
    name: string;
    startDate: string;
    startTime: string;
    steps: number;
  }>;
}

export interface FitbitWeightQueryResult {
    weight: Array<{
      logId: number;
      date: string,
      time: string,
      source: string,
      weight: number,
      bmi: number
    }>;
  }

  export interface FitbitIntradayHeartRateResult{
    "activities-heart": [{
        dateTime: string // carries date string
    }],
    "activities-heart-intraday": {
        dataset: Array<{time: string /* carries only time of the day */, value: number}>
    }
  }