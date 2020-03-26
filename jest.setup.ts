import { DataSourceType } from "@measure/DataSourceSpec";


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