export enum DataSourceCategory{
  Step="step",
  Sleep="sleep",
  Weight="weight",
  HeartRate="heartRate"
}

export enum DataSourceType{
  StepCount="stepcount",
  HoursSlept="sleep_duration",
  SleepRange="sleep_range",
  HeartRate="heart_rate",
  Weight="weight",
}

export interface DataSourceSpec{
  category: DataSourceCategory,
  type: DataSourceType,
  name: string,
  description: string,
  icon: string
}

export enum MeasureUnitType{
  Metric = "metric",
  US = "us"
}