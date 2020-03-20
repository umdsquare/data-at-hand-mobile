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

    console.log("text:", text)

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

const holidayRefiner = new chrono.Refiner();
holidayRefiner.refine = function(text, results, opt){
    console.log("holiday refiner check - ", text)
    console.log(results)
    return results
}

const aroundRefiner = new chrono.Refiner();
aroundRefiner.refine = function(text, results: Array<Chrono.ParsedResult>, opt){
    if(/(around|near)\s+/i.test(text) === true 
    && results.length === 1 
    && results[0].start != null 
    && results[0].end == null
    && results[0].start.isCertain('day') === true){
        //around
        const pivot = results[0].start.date()
        const start = addDays(pivot, -3)
        const end = addDays(pivot, 3)
        return [
            new chrono.ParsedResult({
                ref: results[0].ref,
                text,
                index: 0,
                start: {
                    day: getDate(start),
                    month: getMonth(start)+1,
                    year: getYear(start)
                },
                end:{
                    day:getDate(end),
                    month: getMonth(end)+1,
                    year: getYear(end)
                }
            })
        ]
    }
    return results
}


export const HOLIDAY_PARSERS = [
    christmasParser, newYearsDayParser
]

export const HOLIDAY_REFINERS = [
    holidayRefiner, aroundRefiner
]