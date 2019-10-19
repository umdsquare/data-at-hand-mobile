import {field, date, readonly} from '@nozbe/watermelondb/decorators';
import {Model} from '@nozbe/watermelondb';
import { IHourlyStepBin } from './types';

export class StepBin extends Model implements IHourlyStepBin {
  static table = 'data_step';

  @field('value') value;
  @date('started_at') startedAt;
  @field('measure_code') measureCode;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}

export class HeartRatePoint extends Model {
  static table = 'data_heartrate';

  @field('value') value;
  @date('measured_at') measuredAt;

  @field('measure_code') measureCode;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}

export class WeightPoint extends Model {
  static table = 'data_weight';

  @field('value') value;
  @date('measured_at') measuredAt;

  @field('measure_code') measureCode;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}

export class WorkoutSession extends Model {
  static table = 'data_workout';

  @field('activity_type') activityType;

  @date('started_at') startedAt;
  @date('ended_at') endedAt;

  @field('measure_code') measureCode;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}


export class SleepSession extends Model {
    static table = 'data_sleep';
    
    @date('started_at') startedAt;
    @date('ended_at') endedAt;
  
    @field('measure_code') measureCode;
  
    @readonly @date('created_at') createdAt;
    @readonly @date('updated_at') updatedAt;
  }
  
  
