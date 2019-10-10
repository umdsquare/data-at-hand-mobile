import { MeasureSpec, MeasureType } from "../measure/MeasureSpec";

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
      nameKey: 'step',
      name: 'Step Count',
      description: 'The number of steps walked during a specific period',
    },
    {
      type: MeasureType.Point,
      nameKey: 'heart_rate',
      name: 'Heart Rate',
      description:
        'Heart Rate BPM (Beats per Minute) measured at a specific moment',
    },
    {
      type: MeasureType.Point,
      nameKey: 'weight',
      name: 'Weight',
      description: 'Body weight measured at a specific moment',
    },
    {
      type: MeasureType.Session,
      nameKey: 'sleep',
      name: 'Sleep',
      description: 'A sleep session',
    },
    {
      type: MeasureType.Session,
      nameKey: 'workout',
      name: 'Workout',
      description: 'A workout session',
    },
  ];

  private measureSpecMap: Map<string, MeasureSpec>;

  constructor() {
    this.measureSpecMap = new Map<string, MeasureSpec>();
    this.supportedMeasureSpecs.forEach(spec => {
      this.measureSpecMap[spec.nameKey] = spec;
    });
  }

  getSpec(key: string): MeasureSpec {
    return this.measureSpecMap[key];
  }
}

const measureService = new MeasureService()
export { measureService, MeasureSpecKey}
