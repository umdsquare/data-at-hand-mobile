import {CyclicTimeFrame} from '../../../../core/exploration/data/types';
import { startOfDay, format, addSeconds } from 'date-fns';

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
  let tickFormat: (number) => string;
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
    case CyclicTimeFrame.WeekdayWeekends:
      domain = [0, 1];
      tickFormat = getWdWeName;
      break;
  }

  return {
    domain,
    tickFormat,
  };
}


const timePivot = startOfDay(new Date())

export const timeTickFormat = (tick:number) => {
    if(tick === 0){
        return "MN"
    }
    else return format(addSeconds(timePivot, tick),"h a").toLowerCase()
}