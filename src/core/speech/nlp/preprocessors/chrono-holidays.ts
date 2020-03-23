import chrono from 'chrono-node';
import { getYear, isAfter, addYears, getDate, subDays, getMonth, addDays } from 'date-fns';
import Holidays from '@date/holidays-us';
import { Lazy } from '@utils/utils';

import NamedRegExp from 'named-regexp-groups'
/*
newYearsDay() - can calculate observed holiday as well
valentinesDay()
martinLutherKingDay()
presidentsDay()
easter()
mothersDay()
memorialDay()
fathersDay()
independenceDay() - can calculate observed holiday as well
laborDay()
columbusDay()
halloween()
veteransDay() - can calculate observed holiday as well
thanksgiving()
christmas() - can calculate observed holiday as well

*/

function sdayFormat(core: string): string {
    return `${core}\\'?(s?)(\\s+day)?`
}
function yearFormat(format: string): string {
    return `((?<year1>[1-2][0-9]{3})(\\'s)?\\s+)?${format}(\\s+((of|in)\\s+)?(?<year2>[1-2][0-9]{3}))?`
}

const holidayRules = new Lazy<Array<{ functionName: string, rule: string }>>(() => {
    return [
        { rule: sdayFormat("new\\s+year"), functionName: "newYearsDay" },
        { rule: sdayFormat("valentine"), functionName: 'valentinesDay' },
        { rule: sdayFormat("martin\\s+luther(\\s+king)?(\\s+jr.?)?(\\s+junior)?"), functionName: "martinLutherKingDay" },
        { rule: sdayFormat("president"), functionName: "presidentsDay" },
        { rule: "easter", functionName: 'easter' },
        { rule: sdayFormat("mother"), functionName: "mothersDay" },
        { rule: "memorial\\s+day", functionName: "memorialDay" },
        { rule: sdayFormat("father"), functionName: "fathersDay" },
        { rule: "independence\\s+day", functionName: "independenceDay" },
        { rule: "labor\\s+day", functionName: "laborDay" },
        { rule: sdayFormat("columbus"), functionName: "columbusDay" },
        { rule: "halloween", functionName: "halloween" },
        { rule: sdayFormat("veteran"), functionName: "veteransDay" },
        { rule: "thanksgiving(\\s+day)?", functionName: "thanksgiving" },
        { rule: "christmas", functionName: "christmas" },
    ]
})

const commonHolidayParsers = holidayRules.get().map(rule => {
    const commonHolidayParser = new chrono.Parser();
    commonHolidayParser.pattern = function () { console.log(new NamedRegExp(yearFormat(rule.rule), "i")); return new NamedRegExp(yearFormat(rule.rule), "i") }
    commonHolidayParser.extract = function (text, ref, match, opt) {
        console.log("match:", match)
        const generateFunc: ((year: number) => Date) = Holidays[rule.functionName]
        let date: Date
        if (match.groups.year1 || match.groups.year2) {
            //year remarked.
            let year = match.groups.year1 || match.groups.year2
            date = generateFunc(Number.parseInt(year))
        } else {
            let year = getYear(ref)
            date = generateFunc(year)
            while (isAfter(date, ref) === true) {
                year--
                date = generateFunc(year)
            }
        }

        const result = new chrono.ParsedResult({
            ref,
            text: match[0],
            index: match.index,
            start: {
                day: getDate(date),
                month: getMonth(date) + 1,
                year: getYear(date)
            }
        })

        result.tags["ENHoliday"] = true;
        result.tags[`ENHolidayName${rule.functionName}`] = true;
        return result
    }

    return commonHolidayParser
})


export const HOLIDAY_PARSERS = [].concat(commonHolidayParsers)

export const HOLIDAY_REFINERS = []