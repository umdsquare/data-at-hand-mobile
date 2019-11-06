import {
  IHourlyStepBin,
  IHeartRatePoint,
  IWeightPoint,
  ISleepSession,
  IWorkoutSession,
} from '../types';
import { RealmHandlerBase } from './RealmHandlerBase';

const commonSchema = {
  id: 'string',
  subjectToChange: 'bool',
  measureCode: {type: 'string', indexed: true},
};

const pointCommonSchema = {
  ...commonSchema,
  measuredAt: {type: 'date', indexed: true},
};

const sessionCommonSchema = {
  ...commonSchema,
  startedAt: {type: 'date', indexed: true},
  endedAt: {type: 'date', indexed: true},
  duration: {type: 'int', indexed: true},
};

const HourlyStepBinSchema = {
    name: 'HourlyStepBin',
    primaryKey: 'id',
    properties: {
      startedAt: {type: 'date', indexed: true},
      value: 'int',
      ...commonSchema,
    },
  } as Realm.ObjectSchema

const HeartRatePointSchema = {
    name: 'HeartRatePoint',
    primaryKey: 'id',
    properties: {
      value: 'double',
      ...pointCommonSchema,
    },
  } as Realm.ObjectSchema

const WeightPointSchema = {
    name: 'WeightPoint',
    primaryKey: 'id',
    properties: {
      measuredUsing: 'string?',
      value: 'double',
      ...pointCommonSchema,
    },
  } as Realm.ObjectSchema


const SleepSessionSchema = {
    name: 'SleepSession',
    primaryKey: 'id',
    properties: {
      ...sessionCommonSchema,
      value: 'float',
    },
  } as Realm.ObjectSchema

const WorkoutSessionSchema = {
    name: 'WorkoutSession',
    primaryKey: 'id',
    properties: {
      ...sessionCommonSchema,
      value: 'float',
      activityType: {type: 'string', indexed: true},
    },
  } as Realm.ObjectSchema


export const userRealmConfig = {
  path: 'user.realm',
  deleteRealmIfMigrationNeeded: __DEV__ != null,
  schema: [
    HourlyStepBinSchema,
    HeartRatePointSchema,
    WeightPointSchema,
    SleepSessionSchema,
    WorkoutSessionSchema,
  ],
} as Realm.Configuration;
