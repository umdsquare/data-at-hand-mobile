import { VariableType } from "../types";
import { DateTimeHelper } from "@utils/time";
import { startOfMonth, startOfYear, endOfMonth, endOfYear, addYears, addMonths, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { Chrono } from "../../../../types/chrono";
import NamedRegExp from 'named-regexp-groups'

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
            let periodFuncParams
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
    var chrono = require('chrono-node');
    const chronoResult: Chrono.ParsedResult[] = chrono.parse(text, today)
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
            }

            let endDate: Date | undefined
            if (bestResult.end.isCertain('day')) {
                endDate = bestResult.end.date()
            } else if (bestResult.end.isCertain('month')) {
                endDate = endOfMonth(bestResult.end.date())
            } else if (bestResult.end.isCertain('year')) {
                endDate = endOfYear(bestResult.end.date())
            }

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
    var chrono = require('chrono-node');
    const chronoResult: Chrono.ParsedResult[] = chrono.parse(text, today)
    if (chronoResult.length > 0) {
        const bestResult = chronoResult[0]
        if (bestResult.start.isCertain('day')) {
            const date = bestResult.start.date()
            return DateTimeHelper.toNumberedDateFromDate(date)
        } else return null
    }
    return null
}

export function parseTimeOfTheDayTextToDiffSeconds(text: string, preferred: "day" | "night"): number {
    //Test set
    //half past eleven
    //quarter to twelve
    //10:30
    //8 am
    //7 pm
    //7:30 am
    //ten o'clock

    return 0
}

export function parseDurationTextToSeconds(text: string): number {
    //Test set
    //10 hours
    //4 and a half hours
    //4 hours and 30 minutes
    return 0
}