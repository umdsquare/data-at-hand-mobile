

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
  }

const HeartRatePointSchema = {
    name: 'HeartRatePoint',
    primaryKey: 'id',
    properties: {
      value: 'double',
      ...pointCommonSchema,
    },
  }

const WeightPointSchema = {
    name: 'WeightPoint',
    primaryKey: 'id',
    properties: {
      measuredUsing: 'string?',
      value: 'double',
      ...pointCommonSchema,
    },
  }


const SleepSessionSchema = {
    name: 'SleepSession',
    primaryKey: 'id',
    properties: {
      ...sessionCommonSchema,
      value: 'float',
    },
  }

const WorkoutSessionSchema = {
    name: 'WorkoutSession',
    primaryKey: 'id',
    properties: {
      ...sessionCommonSchema,
      value: 'float',
      activityType: {type: 'string', indexed: true},
    },
  }

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
}
