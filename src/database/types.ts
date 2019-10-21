export interface IDatumBase{
    value: number,
    measureCode: string
}

export interface IPointDatum extends IDatumBase{
    measuredAt: Date
}

export interface ISessionDatum extends IDatumBase{
    duration: number
    startedAt: Date
    endedAt: Date
}

export interface IHourlyStepBin extends IDatumBase{
    startedAt: Date
}


export interface IHeartRatePoint extends IPointDatum {
    
}

export interface IWeightPoint extends IPointDatum{
    measuredUsing: string
}

export interface IWorkoutSession extends ISessionDatum{
    activityType: string
}

export interface ISleepSession extends ISessionDatum{
}