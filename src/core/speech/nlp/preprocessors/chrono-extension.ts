import chrono from 'chrono-node';
import { getYear, isAfter, addYears, getDate, subDays, getMonth, addDays, subYears } from 'date-fns';
import { Chrono } from './chrono';
import { MONTH_NAMES } from '../types';


//===========================================================================

/*export const monthnameParser = new chrono.Parser();
monthnameParser.pattern = function () { return new RegExp(`/(${MONTH_NAMES.join("|")})(\\s+[^0-9])?/`, 'i'); }
monthnameParser.extract = function (text, ref, match, opt) {

    console.log(match)

    const result = new chrono.ParsedResult({
        ref,
        text: match[0],
        index: match.index,
        start: {
            month: 1,
            year: 2020
        }
    })

    result.tags["ENMonthOnly"] = true;

    return result
}*/


const relativePastRefiner = new chrono.Refiner();
relativePastRefiner.refine = function (text, results: Array<Chrono.ParsedResult>, opt) {
    if (results.length === 1 && /((last|past),?\s+)+/i.test(text) === true && (results[0].tags["ENMonthNameParser"] === true || results[0].tags["ENHoliday"] === true)) {
        const match = text.match(/((last|past),?\s+)+/i)
        if (match[0].length + match.index === results[0].index) {

            let date = results[0].start.date()
            while (isAfter(date, results[0].ref) === true) {
                date = subYears(date, 1)
            }

            const dateInfo = {
                year: getYear(date),
                month: getMonth(date) + 1,
            }

            if(results[0].start.isCertain('day') === true){
                dateInfo["day"] = getDate(date)
            }

            const result = [
                new chrono.ParsedResult({
                    ref: results[0].ref,
                    text: match[0] + results[0].text,
                    index: match.index,
                    start: dateInfo,
                    tags: results[0].tags
                })
            ]
            return result
        }
    }
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
                },
                tags: results[0].tags
            })
        ]
    }
    return results
}

export const CHRONO_EXTENSION_PARSERS = []
export const CHRONO_EXTENSION_REFINERS = [relativePastRefiner, aroundRefiner]