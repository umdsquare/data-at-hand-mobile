import { DataSourceType, MeasureUnitType } from "@data-at-hand/core/measure/DataSourceSpec";
import { NLUOptions } from "@core/speech/nlp/types";


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
  measureUnit: MeasureUnitType.Metric
} as NLUOptions