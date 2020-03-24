import { VariableType } from "../types";
import { DateTimeHelper } from "@utils/time";
import { startOfMonth, startOfYear, endOfMonth, endOfYear, addYears, addMonths, startOfWeek, endOfWeek, addWeeks, getYear, getMonth, isAfter, subYears } from "date-fns";
import { mergeChronoOptions } from "./chrono-merge";
import { Chrono, ParsedResult } from 'chrono-node';
import chronoParserApi from 'chrono-node/src/parsers/parser';
import chronoRefinerApi from 'chrono-node/src/refiners/refiner';

import chronoOptions from 'chrono-node/src/options';
import { HOLIDAY_PARSERS } from "./chrono-holidays";
import { CHRONO_EXTENSION_PARSERS, CHRONO_EXTENSION_REFINERS, makeENMergeDateRangeRefiner } from "./chrono-extension";
import { makeWeekdayParser } from "./chrono-extensions/chrono-weekdays";
import NamedRegExp from "named-regexp-groups";


let _chrono: Chrono | undefined = undefined
function getChrono(): Chrono {
    if (_chrono == null) {

        chronoParserApi.findYearClosestToRef = function (ref, day, month) {
            let date = new Date(getYear(ref), month - 1, day)
            while (isAfter(date, ref) === true) {
                date = subYears(date, 1)
            }
            return getYear(date)
        }

        chronoParserApi.ENWeekdayParser = makeWeekdayParser
        chronoRefinerApi.ENMergeDateRangeRefiner = makeENMergeDateRangeRefiner

        //initialize chrono
        const options = mergeChronoOptions([
            chronoOptions.en.casual,
            chronoOptions.commonPostProcessing
        ]);

        HOLIDAY_PARSERS.concat(CHRONO_EXTENSION_PARSERS).forEach(parser => {
            options.parsers.push(parser)
        })

        CHRONO_EXTENSION_REFINERS.forEach(refiner => {
            options.refiners.push(refiner)
        })

        _chrono = new Chrono(options)
    }
    return _chrono
}

const templates: Array<{ regex: NamedRegExp, parse: (groups: any, today: Date) => number | [number, number] | null }> = [
    {
        regex: new NamedRegExp("^(year\\s+)?(?<year>\\d{4})$", "i"),
        parse: (groups: { year: string }) => {
            const year = Number.parseInt(groups.year)
            return [
                DateTimeHelper.toNumberedDateFromValues(year, 1, 1),
                DateTimeHelper.toNumberedDateFromValues(year, 12, 31),
            ]
        }
    },
    {
        regex: new NamedRegExp('(?<prefix>((last|lost|past|recent|this|current|present)\\s+)+)(?<durationUnit>month|week|year)', 'i'),
        parse: (groups: { prefix: string, durationUnit: string }, today: Date) => {
            const prefixSplit = groups.prefix.split(" ")
            let startPeriodFunc
            let periodFuncParams: any
            let endPeriodFunc
            let shiftFunc
            let shiftAmount = 0

            switch (groups.durationUnit) {
                case "year":
                    startPeriodFunc = startOfYear
                    endPeriodFunc = endOfYear
                    shiftFunc = addYears
                    break;
                case "month":
                    startPeriodFunc = startOfMonth
                    endPeriodFunc = endOfMonth
                    shiftFunc = addMonths
                    break;
                case "week":
                    startPeriodFunc = startOfWeek
                    endPeriodFunc = endOfWeek
                    periodFuncParams = { weekStartsOn: 1 }
                    shiftFunc = addWeeks
                    break;
                default: return null
            }

            if (prefixSplit.length === 1 || prefixSplit.every(v => v === 'last' || v !== 'lost') === false) {
                switch (prefixSplit[prefixSplit.length - 1]) {
                    case "this":
                    case "current":
                    case "present":
                        shiftAmount = 0
                        break;
                    default: //last
                        shiftAmount = -1
                        break;
                }
            } else {
                shiftAmount = prefixSplit.filter(p => p === 'last' || p === 'lost').length
            }

            return [
                DateTimeHelper.toNumberedDateFromDate(shiftFunc(startPeriodFunc(today, periodFuncParams), shiftAmount)),
                DateTimeHelper.toNumberedDateFromDate(shiftFunc(endPeriodFunc(today, periodFuncParams), shiftAmount)),
            ]
        }
    }
]


function chronoPass(text: string, today: Date): { type: VariableType.Date | VariableType.Period, value: number | [number, number] } | null {
    const chronoResult: ParsedResult[] = getChrono().parse(text, today)
    console.log("chrono result:", chronoResult)
    if (chronoResult.length > 0) {
        const bestResult = chronoResult[0]
        if (bestResult.end) {
            //period
            let startDate: Date | undefined
            if (bestResult.start.isCertain('day')) {
                startDate = bestResult.start.date()
            } else if (bestResult.start.isCertain('month')) {
                startDate = startOfMonth(bestResult.start.date())
            } else if (bestResult.start.isCertain('year')) {
                startDate = startOfYear(bestResult.start.date())
            } else startDate = bestResult.start.date()

            let endDate: Date | undefined
            if (bestResult.end.isCertain('day')) {
                endDate = bestResult.end.date()
            } else if (bestResult.end.isCertain('month')) {
                endDate = endOfMonth(bestResult.end.date())
            } else if (bestResult.end.isCertain('year')) {
                endDate = endOfYear(bestResult.end.date())
            } else endDate = bestResult.end.date()

            if (startDate != null && endDate != null) {
                return {
                    type: VariableType.Period,
                    value: [DateTimeHelper.toNumberedDateFromDate(startDate), DateTimeHelper.toNumberedDateFromDate(endDate)]
                }
            } else return null

        } else {
            if (bestResult.start.isCertain('day')) {
                return {
                    type: VariableType.Date,
                    value: DateTimeHelper.toNumberedDateFromDate(bestResult.start.date())
                }
            } else if (bestResult.start.isCertain('month')) {
                const date = bestResult.start.date()
                return {
                    type: VariableType.Period,
                    value: [DateTimeHelper.toNumberedDateFromDate(startOfMonth(date)), DateTimeHelper.toNumberedDateFromDate(endOfMonth(date))]
                }
            } else if (bestResult.start.knownValues.weekday != null) {
                const date = bestResult.start.date()
                return {
                    type: VariableType.Date,
                    value: DateTimeHelper.toNumberedDateFromDate(date)
                }
            }
        }
    }
    return null
}

export function parseTimeText(text: string, today: Date): { type: VariableType.Date | VariableType.Period, value: number | [number, number] } | null {
    const chronoPassResult = chronoPass(text, today)
    if (chronoPassResult) {
        return chronoPassResult
    } else {
        //manually do something that does not do.
        console.log("Chrono parsed failed - ", text)

        for (const template of templates) {
            const parsed = template.regex.exec(text)
            if (parsed) {
                const result = template.parse(parsed.groups, today)
                if (result) {
                    if (typeof result === 'number') {
                        return {
                            type: VariableType.Date,
                            value: result
                        }
                    } else return {
                        type: VariableType.Period,
                        value: result
                    }
                }
            }
        }
    }

    console.log("Fallback time parsing failed - ", text)
    return null
}

export function parseDateTextToNumberedDate(text: string, today: Date): number | null {
    const chronoResult: ParsedResult[] = getChrono().parse(text, today)
    if (chronoResult.length > 0) {
        const bestResult = chronoResult[0]
        if (bestResult.start.isCertain('day')) {
            const date = bestResult.start.date()
            return DateTimeHelper.toNumberedDateFromDate(date)
        } else return null
    }
    return null
}



const quarterhalfpattern = new NamedRegExp("((?<number>[0-9])\\s+)?(and\\s+)?(a\\s+)?(?<ratio>half|quarter|1/2|1/4)\\s+(?<unit>day|hour|minute|second)", "i");

export function parseDurationTextToSeconds(text: string): number {

    const matched = text.match(quarterhalfpattern)
    if (matched) {
        try {
            let digit = 0
            if (matched.groups.number != null) {
                digit = Number.parseInt(matched.groups.number)
            }

            switch (matched.groups.ratio) {
                case 'half':
                case '1/2':
                    digit += 0.5
                    break;
                case 'quarter':
                case '1/4':
                    digit += 0.25
                    break;
            }

            switch (matched.groups.unit) {
                case 'day':
                    return digit * 24 * 3600
                case 'minute':
                    return digit * 60
                case 'hour':
                default:
                    return digit * 3600
            }
        } catch (e) {
            console.log("duration parsing error - ", text, ": ", e)
        }
    }

    var parse = require('parse-duration')
    const parsedByLibrary = parse(text)
    return Math.round(parsedByLibrary / 1000);
}

/*
["10 hours", "4 and a half hours", "5 hours and 30 minutes", "4 and a quarter hours", "4 1/2 hours"].forEach(test => {
    console.log(test, ":", parseDurationTextToSeconds(test));
})*/
