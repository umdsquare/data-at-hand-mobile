
import schema from '../database/schema';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import { Database } from '@nozbe/watermelondb';

const adapter = new SQLiteAdapter({schema});
const database = new Database({
    adapter,
    modelClasses: [],
    actionsEnabled: true
})

const stepCollection = database.collections.get('data_step')
const sleepCollection = database.collections.get('data_sleep')
const weightCollection = database.collections.get('data_weight')
const workoutCollection = database.collections.get('data_workout')
const heartrateCollection = database.collections.get('data_heartrate')

export { database, stepCollection, sleepCollection, weightCollection, workoutCollection, heartrateCollection }