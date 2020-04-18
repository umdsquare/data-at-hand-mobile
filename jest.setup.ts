import { DataSourceType, MeasureUnitType } from "@data-at-hand/core/measure/DataSourceSpec";
import { NLUOptions } from "@core/speech/nlp/types";

export const STEP_COUNT_GOAL = 10000
export const HOURS_SLEPT_GOAL = 5 * 3600
export const WEIGHT_GOAL = 70

console.log = jest.fn()
console.debug = jest.fn()

export const dataSources = [
    ["step count", DataSourceType.StepCount],
    ["steps", DataSourceType.StepCount],
    ["weight", DataSourceType.Weight],
    ["heart rate", DataSourceType.HeartRate],
    ["sleep range", DataSourceType.SleepRange],
    ["sleep schedule", DataSourceType.SleepRange],
    ["hours slept", DataSourceType.HoursSlept],
    ["sleep length", DataSourceType.HoursSlept],
  ]


export const speechOptions = {
  getToday: () => new Date(2020, 2, 1), // today is 2020 3/1
  getGoal: async (dataSourceType: DataSourceType) => {
    switch(dataSourceType){
      case DataSourceType.StepCount: return STEP_COUNT_GOAL
      case DataSourceType.HoursSlept: return HOURS_SLEPT_GOAL
      case DataSourceType.Weight: return WEIGHT_GOAL
      default: return null
    }
  },
  measureUnit: MeasureUnitType.Metric,
} as NLUOptions