import {CyclicTimeFrame} from '../../../../core/exploration/data/types';

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
const getDowName = (i: number) => dowNames[i];
const getMonthName = (i: number) => monthNames[i];

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
      domain = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      tickFormat = getMonthName;
      break;
  }

  return {
    domain,
    tickFormat,
  };
}
