import { IDatumBase, IHourlyStepBin, ISleepSession, IWeightPoint, IWorkoutSession, IHeartRatePoint } from "../database/types";

export abstract class MeasureModule<T extends IDatumBase>{
}

export class StepMeasureModule extends MeasureModule<IHourlyStepBin>{
}

export class SleepMeasureModule extends MeasureModule<ISleepSession>{
}

export class WeightMeasureModule extends MeasureModule<IWeightPoint>{
}

export class WorkoutMeasureModule extends MeasureModule<IWorkoutSession>{
}

export class HeartRateMeasureModule extends MeasureModule<IHeartRatePoint>{
}