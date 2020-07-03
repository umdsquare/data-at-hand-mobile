import chrono, { ParsedResult, Refiner, ParsedComponents, ComponentParams, ComponentName, Parser } from 'chrono-node';
import { getYear, isAfter, addYears, getDate, getMonth, addDays, subYears, subWeeks, subMonths, startOfMonth, endOfMonth, isBefore, startOfYear, endOfYear, addMonths, startOfWeek, endOfWeek, addWeeks, subDays, getDay } from 'date-fns';

import NamedRegExp from 'named-regexp-groups'
import { getBetweenText, mergeResult } from './chrono-utils';
import { DateTimeHelper } from '@data-at-hand/core';
import { CHRONO_TAG_RANGE_CERTAIN } from '@core/speech/types';

const dataInitialDateParser = new chrono.Parser();
dataInitialDateParser.pattern = function () { return /(^|\s+)(the\s+)?(Fitbit\s+)?((initial|first)\s+(day|date))(\s+of\s+Fitbit)?($|\s+)/i }
dataInitialDateParser.extract = function (text, ref, match, opt) {

    const initialNumberedDate = opt?.dataInitialDate
    if (initialNumberedDate != null) {

        const initialDate = DateTimeHelper.toDate(initialNumberedDate)

        const extractedText = (match[2] || "") + (match[3] || "") + (match[4] || "") + (match[7] || "")
        const result = new ParsedResult({
            ref,
            text: extractedText,
            index: match.index + match[1].length,
            start: {
                year: getYear(initialDate),
                month: getMonth(initialDate) + 1,
                day: getDate(initialDate)
            }
        })

        return result
    } else return null
}

const entirePeriodParser = new chrono.Parser();
entirePeriodParser.pattern = function () { return /(^|\s+)((the|a|an)\s+)?((entire|all|whole)\s+(period|range|data|dataset))($|\s+)/i }
entirePeriodParser.extract = function (text, ref, match, opt) {

    const initialNumberedDate = opt?.dataInitialDate
    if (initialNumberedDate != null) {

        const initialDate = DateTimeHelper.toDate(initialNumberedDate)

        const extractedText = (match[2] || "") + (match[4] || "")
        const result = new ParsedResult({
            ref,
            text: extractedText,
            index: match.index + match[1].length,
            start: {
                year: getYear(initialDate),
                month: getMonth(initialDate) + 1,
                day: getDate(initialDate)
            },
            end: {
                year: getYear(ref),
                month: getMonth(ref) + 1,
                day: getDate(ref)
            }
        })

        result.tags[CHRONO_TAG_RANGE_CERTAIN] = true

        return result
    } else return null
}


function getSeasonOfYear(season: string, year: number): [Date, Date] {
    switch (season) {
        case "spring":
            return [startOfMonth(new Date(year, 2)), endOfMonth(new Date(year, 4))]
        case "summer":
            return [startOfMonth(new Date(year, 5)), endOfMonth(new Date(year, 7))]
        case "autumn":
        case "fall":
            return [startOfMonth(new Date(year, 8)), endOfMonth(new Date(year, 10))]
        case "winter":
            return [startOfMonth(new Date(year, 11)), endOfMonth(new Date(year + 1, 1))]
    }
}

const seasonParser = new chrono.Parser();
seasonParser.pattern = function () { return new NamedRegExp("(((?<year1>[1-2][0-9]{3})(\\'s)?\\s+)|(?<last>(last,?\\s+)+))?(?<season>spring|summer|fall|autumn|winter)(\\s+((of|in)\\s+)?(?<year2>[1-2][0-9]{3}))?", "i") }
seasonParser.extract = function (text, ref, match, opt) {

    let seasonRange

    const season = match.groups.season.trim()

    if (match.groups.year1 != null || match.groups.year2 != null) {
        const referredYear = Number.parseInt(match.groups.year1 || match.groups.year2)
        seasonRange = getSeasonOfYear(season, referredYear)
    } else {
        let lastCount = 0
        if (match.groups.last) {
            lastCount = match.groups.last.trim().split(/\s+/).length
        }
        let year = getYear(ref)
        seasonRange = getSeasonOfYear(season, year)
        while (isBefore(ref, seasonRange[0])) {
            year--
            seasonRange = getSeasonOfYear(season, year)
        }
        if (lastCount > 0) {
            year -= isBefore(ref, seasonRange[1]) === true ? (lastCount) : lastCount - 1
            seasonRange = getSeasonOfYear(season, year)
        }
    }

    const result = new ParsedResult({
        ref,
        text: match[0],
        index: match.index,
        start: {
            year: getYear(seasonRange[0]),
            month: getMonth(seasonRange[0]) + 1,
            day: getDate(seasonRange[0])
        },
        end: {
            year: getYear(seasonRange[1]),
            month: getMonth(seasonRange[1]) + 1,
            day: getDate(seasonRange[1])
        }
    })

    result.tags["ENSeasonParser"] = true
    result.tags["ENSeason" + season] = true

    return result
}

const yearParser = new Parser();
yearParser.pattern = () => new NamedRegExp("((?<prefixword>year\\s+)|^|\\s+)(?<year>[12]\\d{3})($|\\s+)", "i")
yearParser.extract = (text, ref, match, opt) => {

    const year = Number.parseInt(match.groups.year)
    const prefixWord = match.groups.prefixword
    let index, realText

    if (prefixWord && prefixWord.length > 0) {
        index = match.index
        realText = prefixWord + year
    } else {
        index = match.index + match[1].length
        realText = match.groups.year
    }


    //check if the year is prefixed with 'than'
    if (/\s+than\s+$/i.test(text.substring(0, index)) === true) {
        return null
    }

    const result = new ParsedResult({
        ref,
        text: realText,
        index,
        start: {
            year,
        },
        tags: { "ENYearParser": true }
    })

    return result
}

const recentDurationParser = new Parser();
recentDurationParser.pattern = () => new NamedRegExp("(?<prefix>recent|resent|resend|past|last)\\s+(?<n>[0-9]+|one|two|three|four|five|six|seven|eight|nine|ten)\\s+(?<durationUnit>days?|weeks?|months?|years?)", 'i')
recentDurationParser.extract = (text, ref, match, opt) => {

    let n: number = Number.parseInt(match.groups.n)
    if (Number.isNaN(n) === true) {
        switch (match.groups.n.trim()) {
            case "one": n = 1; break;
            case "two": n = 2; break;
            case "three": n = 3; break;
            case "four": n = 4; break;
            case "five": n = 5; break;
            case "six": n = 6; break;
            case "seven": n = 7; break;
            case "eight": n = 8; break;
            case "nine": n = 9; break;
            case "ten": n = 10; break;
        }
    }

    const durationUnit: string = match.groups.durationUnit
    if (n > 0) {
        let startDate
        if (durationUnit.startsWith("day")) {
            startDate = subDays(ref, n - 1)
        } else if (durationUnit.startsWith("week")) {
            startDate = addDays(subWeeks(ref, n), 1)
        } else if (durationUnit.startsWith("month")) {
            startDate = addDays(subMonths(ref, n), 1)
        } else if (durationUnit.startsWith("year")) {
            startDate = addDays(subYears(ref, n), 1)
        } else return null

        return new ParsedResult({
            ref,
            text: match[0],
            index: match.index,
            start: {
                year: getYear(startDate),
                month: getMonth(startDate) + 1,
                day: getDate(startDate)
            },
            end: {
                year: getYear(ref),
                month: getMonth(ref) + 1,
                day: getDate(ref)
            },
            tags: {
                "ENRecentDurationParser": true,
                [CHRONO_TAG_RANGE_CERTAIN]: true
            }
        })
    } else return null
}

//===========================================================================

//===========================================================================

const aroundRefiner = new chrono.Refiner();
aroundRefiner.refine = function (text, results: Array<ParsedResult>, opt) {
    const match = text.match(/(around|near)\s+/i)
    if (match != null
        && results.length === 1
        && results[0].start != null
        && results[0].end == null
        && results[0].start.isCertain('day') === true) {
        //around
        const pivot = results[0].start.date()
        const start = addDays(pivot, -3)
        const end = addDays(pivot, 3)
        return [
            new chrono.ParsedResult({
                ref: results[0].ref,
                text: match[0] + results[0].text,
                index: match.index,
                start: {
                    day: getDate(start),
                    month: getMonth(start) + 1,
                    year: getYear(start)
                },
                end: {
                    day: getDate(end),
                    month: getMonth(end) + 1,
                    year: getYear(end)
                },
                tags: { ...results[0].tags, CHRONO_TAG_RANGE_CERTAIN: true }
            })
        ]
    }
    return results
}

const theDayBeforeRefiner = new chrono.Refiner();
theDayBeforeRefiner.refine = function (text, results: Array<ParsedResult>, opt) {
    results.forEach((result, i) => {
        if (result.start != null && result.end == null && result.start.isCertain("day") === true) {
            const beforeText = text.substring(0, result.index)
            const match = beforeText.match(new NamedRegExp("(a|the)\\s+day\\s+(?<prefix>before|after)\\s+$", "i"))

            if (match != null) {
                let date = result.start.date()
                if (match.groups.prefix === 'before') {
                    date = addDays(date, -1)
                } else if (match.groups.prefix === 'after') {
                    date = addDays(date, 1)
                }

                results[i] = new chrono.ParsedResult({
                    ref: result.ref,
                    text: match[0] + result.text,
                    index: match.index,
                    start: {
                        day: getDate(date),
                        month: getMonth(date) + 1,
                        year: getYear(date)
                    },
                    tags: result.tags
                })
            }
        }
    })
    return results
}

const sinceRefiner = new Refiner()
sinceRefiner.refine = function (text, results: Array<ParsedResult>, opt) {
    results.forEach((result, index) => {
        const startStringPosition = index === 0 ? 0 : (results[index - 1].index + results[index - 1].text.length)
        const match = text.substring(startStringPosition, result.index).match(/(?:^|\s)(since)\s+/i)
        if (match
            && result.start != null) {

            result.text = match[0] + result.text
            result.index = startStringPosition + match.index
            result.end = new ParsedComponents({
                year: getYear(result.ref),
                month: getMonth(result.ref) + 1,
                day: getDate(result.ref)
            }, result.ref)

            result.tags[CHRONO_TAG_RANGE_CERTAIN] = true

            return results
        }
    })
    return results
}

const weekOfDateRefiner = new Refiner()
weekOfDateRefiner.refine = function (text, results: Array<ParsedResult>, opt) {
    results.forEach((result, index) => {
        if (result.end == null && result.start.isCertain('day') === true) {
            const startStringPosition = index === 0 ? 0 : (results[index - 1].index + results[index - 1].text.length)
            const match = text.substring(startStringPosition, result.index).match(/(^|\s)(((the|a)\s+)?week of)($|\s)/i)
            if (match) {
                result.index = match.index + match[1].length
                result.text = match[2] + match[5] + result.text
                const pivotDate = result.start.date()
                const pivotDayOfWeek = getDay(pivotDate)
                if (pivotDayOfWeek === 0) {
                    //Sunday
                    const endDate = addDays(pivotDate, 6)
                    result.end = new ParsedComponents({
                        year: getYear(endDate),
                        month: getMonth(endDate) + 1,
                        day: getDate(endDate)
                    }, result.ref)
                } else {
                    //get Surrounding Monday through Saturday.
                    const startDate = addDays(pivotDate, 1 - pivotDayOfWeek)
                    const endDate = addDays(pivotDate, 7 - pivotDayOfWeek)
                    result.start = new ParsedComponents({
                        year: getYear(startDate),
                        month: getMonth(startDate) + 1,
                        day: getDate(startDate)
                    }, result.ref)
                    result.end = new ParsedComponents({
                        year: getYear(endDate),
                        month: getMonth(endDate) + 1,
                        day: getDate(endDate)
                    }, result.ref)
                }
                result.tags["WeekOfDateRefiner"] = true
                result.tags[CHRONO_TAG_RANGE_CERTAIN] = true
            }
        }
    })

    return results
}

const prepositionTagRefiner = new Refiner()
const prepositionPattern = new NamedRegExp("((?<from>(start with)|from)|(?<to>to))(\\s+)?$", "i")
prepositionTagRefiner.refine = function (text, results, opt) {
    results.forEach(result => {
        const matchPreposition = text.substring(0, result.index).match(prepositionPattern)
        if (matchPreposition != null) {
            if (matchPreposition.groups.from) {
                result.tags["Preposition"] = "from"
            } else if (matchPreposition.groups.to) {
                result.tags["Preposition"] = "to"
            }
        }
    })

    return results
}

const middleAndConjunctionRegex = /^[,.]?\s*(and|\-)\s*$/i

//e.g., Christmas of 2018 and 2019
const optimizedConjunctionRefiner = new Refiner()
optimizedConjunctionRefiner.refine = (text, results, opt) => {
    if (results.length >= 2 &&
        results[0].end == null && results[1].end == null &&
        //check conjunction
        middleAndConjunctionRegex.test(getBetweenText(text, results[0], results[1])) === true) {

        //1. optimized by year
        if (results[0].start.isCertain('year') === true && results[1].start.isCertain('year')
            && Object.keys(results[0].start.knownValues).length > 1
            && Object.keys(results[1].start.knownValues).length === 1
        ) {

            const year = results[1].start.get('year')
            results[1].start.knownValues = {
                ...results[0].start.knownValues,
                year
            }
            results[1].tags["OptimizedConjunctionRefiner"] = true
        }

    }

    return results
}


const betweenConjunctionRefiner = new Refiner()
betweenConjunctionRefiner.refine = (text, results, opt) => {
    if (results.length >= 2 &&
        results[0].end == null && results[1].end == null) {

        if (middleAndConjunctionRegex.test(getBetweenText(text, results[0], results[1])) === true
        ) {
            const prefixMatch = text.substring(0, results[0].index).match(/(^|\s)(between)\s+/i)
            if (prefixMatch != null) {
                const merged = mergeResult(text, results[0], results[1]);
                merged.index = prefixMatch.index + prefixMatch[1].length
                merged.text = text.substring(merged.index, results[1].index + results[1].text.length)
                merged.tags["BetweenConjunctionRefiner"] = true;
                merged.tags[CHRONO_TAG_RANGE_CERTAIN] = true
                return [merged]
            }
        }
    }

    return results
}


export const CHRONO_EXTENSION_PARSERS = [dataInitialDateParser, entirePeriodParser, seasonParser, yearParser, recentDurationParser]
export const CHRONO_EXTENSION_REFINERS: Array<Refiner> = [aroundRefiner, theDayBeforeRefiner, weekOfDateRefiner, sinceRefiner, prepositionTagRefiner, betweenConjunctionRefiner, optimizedConjunctionRefiner]