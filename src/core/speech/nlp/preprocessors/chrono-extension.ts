import chrono, { ParsedResult, Refiner, ParsedComponents, ComponentParams, ComponentName, Parser } from 'chrono-node';
import { getYear, isAfter, addYears, getDate, getMonth, addDays, subYears, subWeeks, subMonths, startOfMonth, endOfMonth, isBefore, startOfYear, endOfYear, addMonths, startOfWeek, endOfWeek, addWeeks, subDays } from 'date-fns';

import NamedRegExp from 'named-regexp-groups'

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
recentDurationParser.pattern = () => new NamedRegExp("(?<prefix>recent|resent|resend|past|last)\\s+(?<n>[0-9]+)\\s+(?<durationUnit>days?|weeks?|months?|years?)", 'i')
recentDurationParser.extract = (text, ref, match, opt) => {

    const n = Number.parseInt(match.groups.n)
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
                "ENRecentDurationParser": true
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
                tags: results[0].tags
            })
        ]
    }
    return results
}

const sinceRefiner = new Refiner()
sinceRefiner.refine = function (text, results: Array<ParsedResult>, opt) {
    const match = text.match(/(since)\s+/i)
    if (match
        && results.length === 1
        && results[0].start != null
        && results[0].end == null
        && results[0].start.isCertain('day') === true) {

        results[0].text = match[0] + results[0].text
        results[0].index = match.index
        results[0].end = new ParsedComponents({
            year: getYear(results[0].ref),
            month: getMonth(results[0].ref) + 1,
            day: getDate(results[0].ref)
        }, results[0].ref)
        return results
    }
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

export const CHRONO_EXTENSION_PARSERS = [seasonParser, yearParser, recentDurationParser]
export const CHRONO_EXTENSION_REFINERS: Array<Refiner> = [aroundRefiner, sinceRefiner, prepositionTagRefiner]