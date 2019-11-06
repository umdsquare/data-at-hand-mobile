import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  subHours,
  getDayOfYear,
  getYear,
  setDayOfYear,
  addDays,
  setDay,
  addWeeks,
  setMonth,
  addYears,
} from 'date-fns';
import {startOfHour, endOfHour, toDate} from 'date-fns/esm';

enum SemanticType {
  Absolute = 'abs',
  Relative = 'rel',
  Mixed = 'mix',
}

const PERIOD_TYPE_DAY_OF_WEEK = 0;
const PERIOD_TYPE_WEEKDAY_WEEKEND = 1;
const PERIOD_TYPE_DAY_OF_YEAR = 2;
const PERIOD_TYPE_MONTH_OF_YEAR = 3;

enum CyclicPeriod {
  Sunday = 0x000000,
  Monday = 0x000001,
  Tuesday = 0x000002,
  Wednesday = 0x000003,
  Thursday = 0x000004,
  Friday = 0x000005,
  Saturday = 0x000006,

  Weekday = 0x100000,
  Weekend = 0x100001,

  DayOfYear = 0x200000,

  January = 0x300000,
  February = 0x300001,
  March = 0x300002,
  April = 0x300003,
  May = 0x300004,
  June = 0x300005,
  July = 0x300006,
  August = 0x300007,
  September = 0x300008,
  October = 0x300009,
  November = 0x30000a,
  December = 0x30000b,
}

export enum AnchorUnit {
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Year = 'year',
}

export interface Duration {
  from: number;
  to: number;
}

export interface RelativeDurationAnchor {
  unit: AnchorUnit | CyclicPeriod;
  count: number;
}

export interface DurationSemantic {
  type: SemanticType;
  data: any;
}

export interface TimePoint {
  unix: number;
  granularity: AnchorUnit;
}

export function semanticToDuration(
  semantic: DurationSemantic,
  pivot: number = Date.now(),
): Duration {
  switch (semantic.type) {
    case SemanticType.Absolute:
      return {from: semantic.data.from, to: semantic.data.to};
    case SemanticType.Relative:
      return extractDurationFromAnchor(semantic.data, pivot);
    case SemanticType.Mixed:
      return extractMixedDuration(semantic.data.from, semantic.data.to, pivot);
  }
}

function extractDurationFromAnchor(
  anchor: RelativeDurationAnchor,
  pivot: number,
): Duration {
  let anchorPosition: Date = null;

  if (typeof anchor.unit === 'number') {
    switch (getTypeCodeOfCyclickPeriod(anchor.unit)) {
      case PERIOD_TYPE_DAY_OF_WEEK:
        const dowIndex = anchor.unit & 0x00000f; //0 = sunday
        anchorPosition = addWeeks(
          setDay(pivot, dowIndex, {weekStartsOn: 1}),
          anchor.count,
        );
        break;
      case PERIOD_TYPE_DAY_OF_YEAR:
        const pivotDayOfYear = getDayOfYear(pivot);
        const pivotYear = getYear(pivot);
        const date = new Date(pivotYear + anchor.count, 0);
        anchorPosition = setDayOfYear(date, pivotDayOfYear);
        break;
      case PERIOD_TYPE_MONTH_OF_YEAR:
        const monthIndex = anchor.unit & 0x00000f; //0~11
        anchorPosition = addYears(setMonth(pivot, monthIndex), anchor.count);
        break;

      case PERIOD_TYPE_WEEKDAY_WEEKEND:
        anchorPosition = addWeeks(
          startOfWeek(pivot, {weekStartsOn: 1}),
          anchor.count,
        );
        break;
    }
  } else {
    switch (anchor.unit) {
      case AnchorUnit.Hour:
        anchorPosition = subHours(pivot, -anchor.count);
        break;
      case AnchorUnit.Day:
        anchorPosition = subDays(pivot, -anchor.count);
        break;
      case AnchorUnit.Week:
        anchorPosition = subWeeks(pivot, -anchor.count);
        break;
      case AnchorUnit.Month:
        anchorPosition = subMonths(pivot, -anchor.count);
        break;
      case AnchorUnit.Year:
        anchorPosition = subYears(pivot, -anchor.count);
        break;
    }
  }

  if (anchorPosition == null) {
    throw {error: 'UnSupportedAnchorUnit'};
  }

  switch (anchor.unit) {
    case AnchorUnit.Hour:
      return {
        from: startOfHour(anchorPosition).getTime(),
        to: endOfHour(anchorPosition).getTime(),
      };
    case AnchorUnit.Day:
      return {
        from: startOfDay(anchorPosition).getTime(),
        to: endOfDay(anchorPosition).getTime(),
      };
    case AnchorUnit.Week:
      return {
        from: startOfWeek(anchorPosition, {weekStartsOn: 1}).getTime(),
        to: endOfWeek(anchorPosition, {weekStartsOn: 1}).getTime(),
      };
    case AnchorUnit.Month:
      return {
        from: startOfMonth(anchorPosition).getTime(),
        to: endOfMonth(anchorPosition).getTime(),
      };
    case AnchorUnit.Year:
      return {
        from: startOfYear(anchorPosition).getTime(),
        to: endOfYear(anchorPosition).getTime(),
      };
  }

  if (typeof anchor.unit === 'number') {
    switch (getTypeCodeOfCyclickPeriod(anchor.unit)) {
      case PERIOD_TYPE_DAY_OF_WEEK:
      case PERIOD_TYPE_DAY_OF_YEAR:
        return {
          from: startOfDay(anchorPosition).getTime(),
          to: endOfDay(anchorPosition).getTime(),
        };
      case PERIOD_TYPE_MONTH_OF_YEAR:
        return {
          from: startOfMonth(anchorPosition).getTime(),
          to: endOfMonth(anchorPosition).getTime(),
        };
      case PERIOD_TYPE_WEEKDAY_WEEKEND:
        const weekStart = startOfWeek(anchorPosition, {weekStartsOn: 1}); // starts with monday
        if (anchor.unit === CyclicPeriod.Weekday) {
          return {
            from: weekStart.getTime(),
            to: endOfDay(addDays(weekStart, 4)).getTime(),
          };
        } else if (anchor.unit === CyclicPeriod.Weekend) {
          return {
            from: startOfDay(addDays(weekStart, 5)).getTime(),
            to: endOfDay(addDays(weekStart, 6)).getTime(),
          };
        }
    }
  }

  throw {error: 'UnSupportedUnitType'};
}

function extractMixedDuration(
  from: RelativeDurationAnchor | TimePoint,
  to: RelativeDurationAnchor | TimePoint,
  pivot: number,
) {
  let fromTime: number;
  if ('unit' in from && 'count' in from) {
    fromTime = extractDurationFromAnchor(from as RelativeDurationAnchor, pivot)
      .from;
  } else {
    //time point
    fromTime = getTimePointDuration(from as TimePoint).from;
  }

  let toTime: number;
  if ('unit' in to && 'count' in to) {
    toTime = extractDurationFromAnchor(to as RelativeDurationAnchor, pivot).to;
  } else {
    //time point
    toTime = getTimePointDuration(to as TimePoint).to;
  }

  return {from: fromTime, to: toTime};
}

export function getTimePointDuration(point: TimePoint): Duration {
  return extractDurationFromAnchor(
    {unit: point.granularity, count: 0} as RelativeDurationAnchor,
    point.unix,
  );
}

export function isSemanticVolatile(semantic: DurationSemantic): boolean {
  return semantic.type !== SemanticType.Absolute;
}

export function makeAbsoluteDuration(
  from: number,
  to: number,
): DurationSemantic {
  return {
    type: SemanticType.Absolute,
    data: {from, to},
  };
}

export function makeRelativeDuration(
  unit: AnchorUnit | CyclicPeriod,
  count: number,
): DurationSemantic {
  return {
    type: SemanticType.Relative,
    data: {
      unit,
      count,
    } as RelativeDurationAnchor,
  };
}

export function makeMixedDuration(
  from: RelativeDurationAnchor | TimePoint,
  to: RelativeDurationAnchor | TimePoint,
): DurationSemantic {
  return {
    type: SemanticType.Mixed,
    data: {
      from,
      to,
    },
  };
}

export const Presets = {
  TODAY: makeRelativeDuration(AnchorUnit.Day, 0),
  YESTERDAY: makeRelativeDuration(AnchorUnit.Day, -1),
  THIS_WEEK: makeRelativeDuration(AnchorUnit.Week, 0),
  LAST_WEEK: makeRelativeDuration(AnchorUnit.Week, -1),
  LAST_WEEKEND: makeRelativeDuration(CyclicPeriod.Weekend, -1),
  THIS_OCTOBER: makeRelativeDuration(CyclicPeriod.October, 0)
};

function getTypeCodeOfCyclickPeriod(period: CyclicPeriod): number {
  return (0xf00000 & period) >> 20;
}

function getIntsinticUnitOfCyclicPeriod(period: CyclicPeriod): AnchorUnit {
  const periodTypeCode = getTypeCodeOfCyclickPeriod(period);
  switch (periodTypeCode) {
    case PERIOD_TYPE_DAY_OF_WEEK:
    case PERIOD_TYPE_DAY_OF_WEEK:
  }
  return AnchorUnit.Day;
}

console.log(CyclicPeriod.November & 0x00000f); //0 = sunday
