import { MeasureSpec, MeasureType } from "../measure/MeasureSpec";
import { DataSourceMeasure } from "../measure/source/DataSource";
import { MeasureModule, StepMeasureModule, WeightMeasureModule, HeartRateMeasureModule, SleepMeasureModule, WorkoutMeasureModule } from "../measure/MeasureModule";

const MeasureSpecKey = {
    step: "step",
    weight: "weight",
    sleep: "sleep",
    workout: "workout",
    heart: "heart_rate"
}

class MeasureService {

  readonly supportedMeasureSpecs: ReadonlyArray<MeasureSpec> = [
    {
      type: MeasureType.Bin,
      nameKey: MeasureSpecKey.step,
      name: 'Step Count',
      description: 'The number of steps walked during a specific period',
    },
    {
      type: MeasureType.Point,
      nameKey: MeasureSpecKey.heart,
      name: 'Heart Rate',
      description:
        'Heart Rate BPM (Beats per Minute) measured at a specific moment',
    },
    {
      type: MeasureType.Point,
      nameKey: MeasureSpecKey.weight,
      name: 'Weight',
      description: 'Body weight measured at a specific moment',
    },
    {
      type: MeasureType.Session,
      nameKey: MeasureSpecKey.sleep,
      name: 'Sleep',
      description: 'A sleep session',
    },
    {
      type: MeasureType.Session,
      nameKey: MeasureSpecKey.workout,
      name: 'Workout',
      description: 'A workout session',
    },
  ];

  private measureSpecMap: Map<string, MeasureSpec>;

  private measureModuleMap = new Map<string, MeasureModule<any>>();

  constructor() {
    this.measureSpecMap = new Map<string, MeasureSpec>();
    this.supportedMeasureSpecs.forEach(spec => {
      this.measureSpecMap[spec.nameKey] = spec;
    });

    this.measureModuleMap.set(MeasureSpecKey.step, new StepMeasureModule())
    this.measureModuleMap.set(MeasureSpecKey.weight, new WeightMeasureModule())
    this.measureModuleMap.set(MeasureSpecKey.heart, new HeartRateMeasureModule())
    this.measureModuleMap.set(MeasureSpecKey.sleep, new SleepMeasureModule())
    this.measureModuleMap.set(MeasureSpecKey.workout, new WorkoutMeasureModule())
  }

  getSpec(key: string): MeasureSpec {
    return this.measureSpecMap[key];
  }

  getMeasureModule(spec: MeasureSpec): MeasureModule<any> {
    return this.measureModuleMap[spec.nameKey]
  }
}

const measureService = new MeasureService()
export { measureService, MeasureSpecKey}
