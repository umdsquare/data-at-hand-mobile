export enum CyclicTimeFrame {
  DayOfWeek = 'dayOfWeek',
  MonthOfYear = 'month',
  SeasonOfYear = 'season',
  //WeekdayWeekends = 'wdwe',
}

export const cyclicTimeFrameSpecs: {
  [type: string]: {type: CyclicTimeFrame; name: string};
} = {};
cyclicTimeFrameSpecs[CyclicTimeFrame.DayOfWeek] = {
  type: CyclicTimeFrame.DayOfWeek,
  name: 'Days of the Week',
};
cyclicTimeFrameSpecs[CyclicTimeFrame.MonthOfYear] = {
  type: CyclicTimeFrame.MonthOfYear,
  name: 'Months of the Year',
};
/*
cyclicTimeFrameSpecs[CyclicTimeFrame.SeasonOfYear] = {
  type: CyclicTimeFrame.SeasonOfYear,
  name: 'Seasons of the Year',
};*/
/*
cyclicTimeFrameSpecs[CyclicTimeFrame.WeekdayWeekends] = {
  type: CyclicTimeFrame.WeekdayWeekends,
  name: 'Weekday / Weekends',
};*/

export enum CycleDimension {
  Sunday = 'day|dayOfWeek|0',
  Monday = 'day|dayOfWeek|1',
  Tuesday = 'day|dayOfWeek|2',
  Wednesday = 'day|dayOfWeek|3',
  Thursday = 'day|dayOfWeek|4',
  Friday = 'day|dayOfWeek|5',
  Saturday = 'day|dayOfWeek|6',

  January = 'year|month|1',
  February = 'year|month|2',
  March = 'year|month|3',
  April = 'year|month|4',
  May = 'year|month|5',
  June = 'year|month|6',
  July = 'year|month|7',
  August = 'year|month|8',
  September = 'year|month|9',
  October = 'year|month|10',
  November = 'year|month|11',
  December = 'year|month|12',

  Spring = 'year|season|0',
  Summer = 'year|season|1',
  Fall = 'year|season|2',
  Winter = 'year|season|3',

  //Weekdays = 'week|wdwe|0',
  //Weekends = 'week|wdwe|1',
}

export interface CycleDimensionSpec {
  name: string;
  cycleType?: CyclicTimeFrame;
  dimension?: CycleDimension;
  level?: "year"|"day",
  timeKey?: number
}

const cycleDimensionSpecs: {[key: string]: CycleDimensionSpec} = {};
cycleDimensionSpecs[CycleDimension.Monday] = {name: 'Monday'};
cycleDimensionSpecs[CycleDimension.Tuesday] = {name: 'Tuesday'};
cycleDimensionSpecs[CycleDimension.Wednesday] = {name: 'Wednesday'};
cycleDimensionSpecs[CycleDimension.Thursday] = {name: 'Thursday'};
cycleDimensionSpecs[CycleDimension.Friday] = {name: 'Friday'};
cycleDimensionSpecs[CycleDimension.Saturday] = {name: 'Saturday'};
cycleDimensionSpecs[CycleDimension.Sunday] = {name: 'Sunday'};

cycleDimensionSpecs[CycleDimension.January] = {name: 'January'};
cycleDimensionSpecs[CycleDimension.February] = {name: 'February'};
cycleDimensionSpecs[CycleDimension.March] = {name: 'March'};
cycleDimensionSpecs[CycleDimension.April] = {name: 'April'};
cycleDimensionSpecs[CycleDimension.May] = {name: 'May'};
cycleDimensionSpecs[CycleDimension.June] = {name: 'June'};
cycleDimensionSpecs[CycleDimension.July] = {name: 'July'};
cycleDimensionSpecs[CycleDimension.August] = {name: 'August'};
cycleDimensionSpecs[CycleDimension.September] = {name: 'September'};
cycleDimensionSpecs[CycleDimension.October] = {name: 'October'};
cycleDimensionSpecs[CycleDimension.November] = {name: 'November'};
cycleDimensionSpecs[CycleDimension.December] = {name: 'December'};

cycleDimensionSpecs[CycleDimension.Spring] = {name: 'Spring'};
cycleDimensionSpecs[CycleDimension.Summer] = {name: 'Summber'};
cycleDimensionSpecs[CycleDimension.Fall] = {name: 'Fall'};
cycleDimensionSpecs[CycleDimension.Winter] = {name: 'Winter'};

//cycleDimensionSpecs[CycleDimension.Weekdays] = {name: 'Weekdays'};
//cycleDimensionSpecs[CycleDimension.Weekends] = {name: 'Weekends'};

for (const dimension of Object.keys(cycleDimensionSpecs)) {
  const split = dimension.split('|')
  cycleDimensionSpecs[dimension].cycleType = split[1] as CyclicTimeFrame;
  cycleDimensionSpecs[dimension].dimension = dimension as any;
  cycleDimensionSpecs[dimension].level = split[0] as any;
  cycleDimensionSpecs[dimension].timeKey = Number.parseInt(split[2])
  
}

export function getHomogeneousCycleDimensionList(dimension: CycleDimension){
  const spec = getCycleDimensionSpec(dimension)
  return getFilteredCycleDimensionList(spec.cycleType)
}

export function getFilteredCycleDimensionList(
  cycleType: CyclicTimeFrame,
): CycleDimensionSpec[] {
  return Object.keys(cycleDimensionSpecs)
    .filter(dimension => cycleDimensionSpecs[dimension].cycleType === cycleType)
    .map(dimension => cycleDimensionSpecs[dimension]);
}

export function getCycleDimensionSpec(
  dimension: CycleDimension,
): CycleDimensionSpec {
  return cycleDimensionSpecs[dimension];
}

export function getCycleTypeOfDimension(dimension: CycleDimension): CyclicTimeFrame{
  return cycleDimensionSpecs[dimension].cycleType
}

export function getCycleLevelOfDimension(dimension: CycleDimension): "year" | "day"{
  return cycleDimensionSpecs[dimension].level
}

export function getTimeKeyOfDimension(dimension: CycleDimension): number{
  return cycleDimensionSpecs[dimension].timeKey
}

export function getCycleDimensionWithTimeKey(cycleType: CyclicTimeFrame, timeKey: number): CycleDimension{
  return Object.keys(cycleDimensionSpecs).find(dimension => cycleDimensionSpecs[dimension].cycleType === cycleType && cycleDimensionSpecs[dimension].timeKey === timeKey) as CycleDimension
}