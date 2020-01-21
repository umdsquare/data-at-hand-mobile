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

export interface FitbitDailyActivityHeartRateQueryResult{
  "activities-heart": Array<{
    dateTime: string,
    value: {
      restingHeartRate: number,
      customHeartRateZones: Array<any>,
      heartRateZones: Array<{
        caloriesOut: number,
        max: number,
        min: number,
        minutes: 1090,
        name: string
      }>
    }
  }>
}

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