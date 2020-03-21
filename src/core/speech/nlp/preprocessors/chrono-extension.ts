import chrono from 'chrono-node';
import { getYear, isAfter, addYears, getDate, subDays, getMonth, addDays, subYears, subWeeks, subMonths, startOfMonth, endOfMonth, isBefore } from 'date-fns';
import { Chrono } from './chrono';
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
seasonParser.pattern = function () { return new NamedRegExp("(((?<year1>[1-2][0-9]{3})(\\'s)?\\s+)|(?<last>(last,?\\s+)+))?(?<season>spring|summer|autumn|winter)(\\s+((of|in)\\s+)?(?<year2>[1-2][0-9]{3}))?", "i") }
seasonParser.extract = function (text, ref, match, opt) {


    let seasonRange

    const season = match.groups.season.trim()

    let referredYear = match.groups.year1 || match.groups.year2
    if (referredYear) {
        referredYear = Number.parseInt(referredYear)
        seasonRange = getSeasonOfYear(season, referredYear)
    } else {
        let lastCount = 0
        if (match.groups.last) {
            lastCount = match.groups.last.trim().split(/\s+/).length - 1
        }
        let year = getYear(ref)
        seasonRange = getSeasonOfYear(season, year)
        while (isBefore(ref, seasonRange[0])) {
            year--
            seasonRange = getSeasonOfYear(season, year)
        }
        if (lastCount > 0) {
            year -= lastCount
            seasonRange = getSeasonOfYear(season, year)
        }
    }

    const result = new chrono.ParsedResult({
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

//===========================================================================

const relativePastRefiner = new chrono.Refiner();
relativePastRefiner.refine = function (text, results: Array<Chrono.ParsedResult>, opt) {

    const shouldRefine = results.length === 1 && /((last|past),?\s+)+/i.test(text) === true
        && (
            results[0].tags["ENMonthNameParser"] === true
            || results[0].tags["ENRelativeDateFormatParser"] === true
            || results[0].tags["ENWeekdayParser"] === true
        )

    if (shouldRefine === true) {
        const match = text.match(/((last|past),?\s+)+/i)
        if (match[0].length + match.index >= results[0].index) {

            const numWords = match[0].trim().split(/\s+/).length

            let date = results[0].start.date()

            if (results[0].tags["ENWeekdayParser"] === true) {
                while (isAfter(date, results[0].ref) === true) {
                    date = subWeeks(date, 1)
                }

                date = subWeeks(date, numWords - 1)

            } else if (results[0].tags["ENMonthNameParser"] === true) {
                while (isAfter(date, results[0].ref) === true) {
                    date = subYears(date, 1)
                }

                date = subYears(date, numWords - 1)
            } else if (results[0].tags["ENRelativeDateFormatParser"] === true) {
                while (isAfter(date, results[0].ref) === true) {
                    date = subMonths(date, 1)
                }

                date = subMonths(date, numWords - 1)
            }

            //first it should be the past

            const dateInfo = {
                year: getYear(date),
                month: getMonth(date) + 1,
            }

            if (results[0].start.isCertain('day') === true) {
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
aroundRefiner.refine = function (text, results: Array<Chrono.ParsedResult>, opt) {
    if (/(around|near)\s+/i.test(text) === true
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
                text,
                index: 0,
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

const sinceRefiner = new chrono.Refiner()
sinceRefiner.refine = function (text, results: Array<Chrono.ParsedResult>, opt) {
    const match = text.match(/(since)\s+/i)
    if (match
        && results.length === 1
        && results[0].start != null
        && results[0].end == null
        && results[0].start.isCertain('day') === true) {

        results[0].text = match[0] + results[0].text
        results[0].end = new chrono.ParsedComponents({
            year: getYear(results[0].ref),
            month: getMonth(results[0].ref) + 1,
            day: getDate(results[0].ref)
        }, results[0].ref)
        return results
    }
    return results
}

export const CHRONO_EXTENSION_PARSERS = [seasonParser]
export const CHRONO_EXTENSION_REFINERS = [relativePastRefiner, aroundRefiner, sinceRefiner]