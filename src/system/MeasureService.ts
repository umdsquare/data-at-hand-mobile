import { MeasureModule, StepMeasureModule, WeightMeasureModule, HeartRateMeasureModule, SleepMeasureModule, WorkoutMeasureModule } from "../measure/MeasureModule";
import { DataSourceSpec, DataSourceType, DataSourceCategory } from "../measure/DataSourceSpec";

export const MeasureSpecKey = {
    step: "step",
    weight: "weight",
    sleep: "sleep",
    workout: "workout",
    heart: "heart_rate"
}

class DataSourceManager {

  readonly supportedDataSources: ReadonlyArray<DataSourceSpec> = [
    {
      type: DataSourceType.StepCount,
      category: DataSourceCategory.Step,
      name: "Step Count",
      description: 'Step Count Walked',
      icon: 'step'
    },
    {
      type: DataSourceType.HeartRate,
      category: DataSourceCategory.HeartRate,
      name: 'Heart Rate',
      description:
        'Heart Rate BPM (Beats per Minute) measured at a specific moment',
      icon: 'heartrate'
    },
    {
      type: DataSourceType.Weight,
      category: DataSourceCategory.Weight,
      name: 'Weight',
      description: 'Body weight measured at a specific moment',
      icon: 'weight'
    },
    {
      type: DataSourceType.HoursSlept,
      category: DataSourceCategory.Sleep,
      name: 'Hours Slept',
      description: 'A length of sleep of the day',
      icon: 'sleep'
    },

    {
      type: DataSourceType.SleepRange,
      category: DataSourceCategory.Sleep,
      name: 'Sleep Range',
      description: "Bedtime and Wake time of the day\'s sleep",
      icon: 'sleep'
    }
  ];

  private specMap: Map<string, DataSourceSpec>;

  private moduleMap = new Map<string, MeasureModule<any>>();

  constructor() {
    this.specMap = new Map<string, DataSourceSpec>();
    this.supportedDataSources.forEach(spec => {
      this.specMap[spec.type] = spec;
    });

  }

  getSpec(key: string): DataSourceSpec {
    return this.specMap[key];
  }
}

const dataSourceManager = new DataSourceManager()
export { dataSourceManager }
