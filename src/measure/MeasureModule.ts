import { Collection, Model } from "@nozbe/watermelondb";
import { StepBin, SleepSession, WeightPoint, WorkoutSession, HeartRatePoint } from "../database/models";
import { stepCollection, sleepCollection, weightCollection, workoutCollection, heartrateCollection } from "../system/Database";

export abstract class MeasureModule<T extends Model>{
    protected abstract readonly dbCollection: Collection<T>
}

export class StepMeasureModule extends MeasureModule<StepBin>{
    dbCollection = stepCollection
}

export class SleepMeasureModule extends MeasureModule<SleepSession>{
    dbCollection = sleepCollection
}

export class WeightMeasureModule extends MeasureModule<WeightPoint>{
    dbCollection = weightCollection
}

export class WorkoutMeasureModule extends MeasureModule<WorkoutSession>{
    dbCollection = workoutCollection
}

export class HeartRateMeasureModule extends MeasureModule<HeartRatePoint>{
    dbCollection = heartrateCollection
}