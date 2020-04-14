import { lastDayOfWeek, getYear, getMonth, getDate, getDay, addDays, startOfWeek, subWeeks } from 'date-fns';
import { Parser, ParsedResult } from 'chrono-node';
import NamedRegExp from 'named-regexp-groups';

const DAYS_OFFSET: { [key: string]: number } = {
    'sunday': 0, 'sun': 0, 'monday': 1, 'mon': 1, 'tuesday': 2, 'tues': 2, 'tue': 2, 'wednesday': 3, 'wed': 3,
    'thursday': 4, 'thurs': 4, 'thur': 4, 'thu': 4, 'friday': 5, 'fri': 5, 'saturday': 6, 'sat': 6
};

const PATTERN = new NamedRegExp('(on\\s*?)?' +
    '(?<prefix>((this|last|past|next)\\s+)+)?' +
    '(?<dow>' + Object.keys(DAYS_OFFSET).join('|') + ')' +
    '((on|of|in)\s+)?' +
    '(?:\s*(?<suffix>((this|last|past|next)\\s*)+)week)?($|\\s)', 'i');

export const makeWeekdayParser = () => {
    const weekdayParser = new Parser()

    weekdayParser.pattern = () => PATTERN
    weekdayParser.extract = function (text, ref: Date, match, opt) {
        console.log(text, match)
        var index = match.index;
        var text = match[0];
        var result: ParsedResult = new ParsedResult({
            index,
            text,
            ref
        });

        var dayOfWeek = match.groups.dow.toLowerCase();
        var offset = DAYS_OFFSET[dayOfWeek];
        if (offset === undefined) {
            return null;
        }

        var prefix = match.groups.prefix;
        var postfix = match.groups.postfix;
        var norm = prefix || postfix;
        norm = norm || '';
        norm = norm.toLowerCase().trim();

        let date
        if (norm.length === 0 || norm == 'past') {
            //find recent one
            const currentDayOfWeek = getDay(ref)

            let diff = (offset - currentDayOfWeek)
            if (diff > 0) diff -= 7

            date = addDays(ref, diff)
        } else if (norm === 'this') {
            date = addDays(startOfWeek(ref, { weekStartsOn: 1 }), offset-1)
        } else if (norm === 'next') {
            date = addDays(startOfWeek(ref, { weekStartsOn: 1 }), offset-1 + 7)
        } else {
            const numLast = norm.split(" ").length

            date = addDays(subWeeks(startOfWeek(ref, { weekStartsOn: 1 }), 1), offset == 0 ? 6 : (offset - 1))
            date = addDays(date, -7 * (numLast - 1))
        }

        const funcName = norm.length === 0 ? 'imply' : 'assign'
        result.start[funcName]('year', getYear(date))
        result.start[funcName]('month', getMonth(date) + 1)
        result.start[funcName]('day', getDate(date))
        if (funcName === 'imply') {
            result.start.assign('weekday', offset)
            result.start.knownValues['weekday'] = offset
        }

        result.tags['ENWeekdayParser'] = true;

        return result;
    }

    return weekdayParser
}