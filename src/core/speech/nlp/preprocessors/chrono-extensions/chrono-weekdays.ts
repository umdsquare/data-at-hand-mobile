import chrono from 'chrono-node';

import { Chrono } from '../chrono';
import { lastDayOfWeek, getYear, getMonth, getDate, getDay, addDays, startOfWeek, subWeeks } from 'date-fns';

const DAYS_OFFSET = {
    'sunday': 0, 'sun': 0, 'monday': 1, 'mon': 1, 'tuesday': 2, 'tues': 2, 'tue': 2, 'wednesday': 3, 'wed': 3,
    'thursday': 4, 'thurs': 4, 'thur': 4, 'thu': 4, 'friday': 5, 'fri': 5, 'saturday': 6, 'sat': 6
};

const PATTERN = new RegExp('(\\W|^)' +
    '(?:(?:\\,|\\(|\\（)\\s*)?' +
    '(?:on\\s*?)?' +
    '(?:(this|last|past|next)\\s*)?' +
    '(' + Object.keys(DAYS_OFFSET).join('|') + ')' +
    '(?:\\s*(?:\\,|\\)|\\）))?' +
    '(?:\\s*(this|last|past|next)\\s*week)?' +
    '(?=\\W|$)', 'i');

const PREFIX_GROUP = 2;
const WEEKDAY_GROUP = 3;
const POSTFIX_GROUP = 4;


export const makeWeekdayParser = () => {
    const weekdayParser = new chrono.Parser()

    weekdayParser.pattern = () => PATTERN
    weekdayParser.extract = function (text, ref: Date, match, opt) {
        var index = match.index + match[1].length;
        var text = match[0].substr(match[1].length, match[0].length - match[1].length);
        var result: Chrono.ParsedResult = new chrono.ParsedResult({
            index,
            text,
            ref
        });

        var dayOfWeek = match[WEEKDAY_GROUP].toLowerCase();
        var offset = DAYS_OFFSET[dayOfWeek];
        if (offset === undefined) {
            return null;
        }

        var prefix = match[PREFIX_GROUP];
        var postfix = match[POSTFIX_GROUP];
        var norm = prefix || postfix;
        norm = norm || '';
        norm = norm.toLowerCase();

        let date
        if (norm.length === 0 || norm == 'past') {
            //find recent one
            const currentDayOfWeek = getDay(ref)

            let diff = (offset - currentDayOfWeek)
            if (diff > 0) diff -= 7

            date = addDays(ref, diff)
        } else if (norm == 'last') {
            date = addDays(subWeeks(startOfWeek(ref, { weekStartsOn: 1 }), 1), offset == 0 ? 6 : (offset - 1))
        }

        result.start.assign('year', getYear(date))
        result.start.assign('month', getMonth(date) + 1)
        result.start.assign('day', getDate(date))

        result.tags['ENWeekdayParser'] = true;
        result.tags['ENWeekdayPastParser'] = true;


        return result;
    }

    return weekdayParser
}