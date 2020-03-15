import { DataSourceSpec, DataSourceType, DataSourceCategory, DataSourceCategorySpec } from "@measure/DataSourceSpec";
import commaNumber from 'comma-number';

export class DataSourceManager {

  private static _instance: DataSourceManager

  static get instance(): DataSourceManager {
    if (this._instance == null) {
      this._instance = new DataSourceManager()
    }
    return this._instance
  }

  readonly supportedDataSources: ReadonlyArray<DataSourceSpec> = [

    {
      type: DataSourceType.StepCount,
      category: DataSourceCategory.Step,
      name: "Step Count",
      description: 'Step Count Walked',
    },
    {
      type: DataSourceType.HeartRate,
      category: DataSourceCategory.HeartRate,
      name: 'Resting Heart Rate',
      description:
        'Heart Rate BPM (Beats per Minute) measured at a specific moment',
    },

    {
      type: DataSourceType.SleepRange,
      category: DataSourceCategory.Sleep,
      name: 'Sleep Range',
      description: "Bedtime and Wake time of the day\'s sleep",
    },

    {
      type: DataSourceType.HoursSlept,
      category: DataSourceCategory.Sleep,
      name: 'Hours Slept',
      description: 'A length of sleep of the day',
    },
    {
      type: DataSourceType.Weight,
      category: DataSourceCategory.Weight,
      name: 'Weight',
      description: 'Body weight measured at a specific moment',
    },
  ];

  readonly dataSourceCategorySpecs: { [key: string]: DataSourceCategorySpec } = {}

  private specMap: Map<DataSourceType, DataSourceSpec>;

  private constructor() {

    this.dataSourceCategorySpecs[DataSourceCategory.Step] = {
      category: DataSourceCategory.Step,
      name: "Step"
    }
    this.dataSourceCategorySpecs[DataSourceCategory.Sleep] = {
      category: DataSourceCategory.Sleep,
      name: "Sleep"
    }

    this.dataSourceCategorySpecs[DataSourceCategory.HeartRate] = {
      category: DataSourceCategory.HeartRate,
      name: "Heart Rate"
    }

    this.dataSourceCategorySpecs[DataSourceCategory.Weight] = {
      category: DataSourceCategory.Weight,
      name: 'Weight'
    }

    this.specMap = new Map<DataSourceType, DataSourceSpec>();
    this.supportedDataSources.forEach(spec => {
      this.specMap[spec.type] = spec;
    });

  }

  getSpec(key: DataSourceType): DataSourceSpec {
    return this.specMap[key];
  }

  formatValue(value: any, type: DataSourceType): string {
    switch (type) {
      case DataSourceType.StepCount:
        return commaNumber(Math.round(value))
      default:
        return value.toString()
    }
  }
}