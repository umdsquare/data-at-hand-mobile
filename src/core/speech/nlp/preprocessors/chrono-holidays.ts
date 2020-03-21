import chrono from 'chrono-node';
import { getYear, isAfter, addYears, getDate, subDays, getMonth, addDays } from 'date-fns';
import { Chrono } from './chrono';


//===========================================================================

const christmasParser = new chrono.Parser();
christmasParser.pattern = function () { return /Christmas(\s+(eve))?/i; }
christmasParser.extract = function (text, ref, match, opt) {

    const isEve = match[2] === 'eve'

    let christmas = new Date(getYear(ref), 11, isEve === true ? 24 : 25)
    while (isAfter(christmas, ref) === true) {
        christmas = addYears(christmas, -1)
    }

    const result = new chrono.ParsedResult({
        ref,
        text: match[0],
        index: match.index,
        start: {
            day: isEve === true ? 24 : 25,
            month: 12,
            year: getYear(christmas)
        }
    })

    result.tags["ENHoliday"] = true;
    result.tags[`ENHolidayChristmas${isEve ? "Eve" : ""}`] = true;

    return result
}

const newYearsDayParser = new chrono.Parser();
newYearsDayParser.pattern = function () { return /new\s+year(\'?)s?\s+(day|eve)/i; }
newYearsDayParser.extract = function (text, ref, match, opt) {

    const isEve = match[2] === 'eve'

    let newYearsDay = new Date(getYear(ref), 0, 1)
    if (isEve) {
        newYearsDay = subDays(newYearsDay, 1)
    }
    while (isAfter(newYearsDay, ref) === true) {
        newYearsDay = addYears(newYearsDay, -1)
    }

    const result = new chrono.ParsedResult({
        ref,
        text: match[0],
        index: match.index,
        start: {
            day: getDate(newYearsDay),
            month: getMonth(newYearsDay) + 1,
            year: getYear(newYearsDay)
        }
    })

    result.tags["ENHoliday"] = true;
    result.tags[`ENHolidayNewYears${isEve ? "Eve" : "Day"}`] = true;

    return result
}


const yearRefiner = new chrono.Refiner();
yearRefiner.refine = function(text, results: Array<Chrono.ParsedResult>, opt){
    if(/[1-2][0-9]{3}(\s|$)/i.test(text) === true 
    && results.length === 1 
    && results[0].tags["ENHoliday"] === true){
        //TODO Don't just shift the holiday. Calculate it.
        const year = Number.parseInt(text.match(/([1-2][0-9]{3})(\s|$)/i)[0])
        results[0].start.assign("year", year)
        return results
    }
    return results
}


export const HOLIDAY_PARSERS = [
    christmasParser, newYearsDayParser
]

export const HOLIDAY_REFINERS = [
    yearRefiner
]