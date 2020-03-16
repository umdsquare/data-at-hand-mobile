import { startOfDay, format, addSeconds } from 'date-fns';
import { CyclicTimeFrame, getCycleDimensionWithTimeKey } from '@core/exploration/cyclic_time';
import { ScaleBand } from 'd3-scale';
import { LayoutRectangle } from 'react-native';
import { TouchingElementInfo, TouchingElementValueType, ParameterType } from '@core/exploration/types';
import { DataSourceType } from '@measure/DataSourceSpec';
import { getScaleStepLeft } from '../d3-utils';

const dowNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const seasonNames = ['Spring', 'Summer', 'Fall', 'Winter'];

const wdweNames = ['Weekdays', 'Weekends'];

const getDowName = (i: number) => dowNames[i];
const getMonthName = (i: number) => monthNames[i - 1];
const getSeasonName = (i: number) => seasonNames[i];
const getWdWeName = (i: number) => wdweNames[i];

export function getDomainAndTickFormat(
  cycleType: CyclicTimeFrame,
): {
  domain: number[];
  tickFormat: (num: number) => string;
} {
  let domain: number[];
  let tickFormat: (num: number) => string;
  switch (cycleType) {
    case CyclicTimeFrame.DayOfWeek:
      domain = [0, 1, 2, 3, 4, 5, 6];
      tickFormat = getDowName;
      break;
    case CyclicTimeFrame.MonthOfYear:
      domain = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      tickFormat = getMonthName;
      break;
    case CyclicTimeFrame.SeasonOfYear:
      domain = [0, 1, 2, 3];
      tickFormat = getSeasonName;
      break;
    /*
  case CyclicTimeFrame.WeekdayWeekends:
    domain = [0, 1];
    tickFormat = getWdWeName;
    break;*/
  }

  return {
    domain,
    tickFormat,
  };
}


const timePivot = startOfDay(new Date())

export const timeTickFormat = (tick: number) => {
  if (tick === 0) {
    return "MN"
  }
  else return format(addSeconds(timePivot, tick), "h a").toLowerCase()
}

export function makeTouchingInfoForCycle(
  timeKey: number,
  dataSource: DataSourceType,
  cycleType: CyclicTimeFrame,
  scaleX: ScaleBand<number>,
  chartArea: LayoutRectangle,
  touchX: number, touchY: number, touchScreenX: number, touchScreenY: number,
  touchId: string, getValue: (timeKey: number) => any): TouchingElementInfo {
  const info = {
    touchId,
    elementBoundInScreen: {
      x: touchScreenX - touchX + chartArea.x + getScaleStepLeft(scaleX, timeKey),
      y: touchScreenY - touchY + chartArea.y,
      width: scaleX.step(),
      height: chartArea.height
    },
    params: [
      { parameter: ParameterType.DataSource, value: dataSource },
      { parameter: ParameterType.CycleDimension, value: getCycleDimensionWithTimeKey(cycleType, timeKey) }
    ],
    valueType: TouchingElementValueType.CycleDimension
  } as TouchingElementInfo

  try {
    info.value = getValue(timeKey)
  } catch (e) {

  }

  return info
}