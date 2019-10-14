
import schema from '../database/schema';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import { Database } from '@nozbe/watermelondb';
import { StepBin, SleepSession, WeightPoint, WorkoutSession, HeartRatePoint } from '../database/models';

const adapter = new SQLiteAdapter({
    dbName: "data_at_hand_backend",
    schema: schema
});
const database = new Database({
    adapter,
    modelClasses: [
        StepBin as any,
        SleepSession,
        WeightPoint,
        WorkoutSession,
        HeartRatePoint
    ],
    actionsEnabled: true
})

const stepCollection = database.collections.get<StepBin>('data_step')
const sleepCollection = database.collections.get<SleepSession>('data_sleep')
const weightCollection = database.collections.get<WeightPoint>('data_weight')
const workoutCollection = database.collections.get<WorkoutSession>('data_workout')
const heartrateCollection = database.collections.get<HeartRatePoint>('data_heartrate')

export { database, stepCollection, sleepCollection, weightCollection, workoutCollection, heartrateCollection }