import { Parser, ParsedResult } from "chrono-node";
import NamedRegExp from "named-regexp-groups";
import { startOfYear, endOfYear, addYears, startOfMonth, endOfMonth, addMonths, startOfWeek, endOfWeek, addWeeks, getYear, getMonth, getDate } from "date-fns";

export const makeRelativeDateFormatParser = () => {

    const relativeSemanticPeiodParser = new Parser();
    relativeSemanticPeiodParser.pattern = () => new NamedRegExp('(?<prefix>((last|lost|past|recent|this|current|present)\\s+)+)(?<durationUnit>month|week|year)', 'i')
    relativeSemanticPeiodParser.extract = (text, ref, match, opt) => {
        const prefix = match.groups.prefix.trim()
        const prefixSplit = prefix.split(" ")
        let startPeriodFunc
        let periodFuncParams: any
        let endPeriodFunc
        let shiftFunc
        let shiftAmount = 0

        switch (match.groups.durationUnit) {
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
            shiftAmount = -prefixSplit.filter(p => p === 'last' || p === 'lost').length
        }

        const startDate = shiftFunc(startPeriodFunc(ref, periodFuncParams), shiftAmount)

        let result: ParsedResult

        switch (match.groups.durationUnit) {
            case "month":
                result = new ParsedResult({
                    ref,
                    text: match[0],
                    index: match.index,
                    start: {
                        year: getYear(startDate),
                        month: getMonth(startDate) + 1
                    }
                })
            case "year":
                result = new ParsedResult({
                    ref,
                    text: match[0],
                    index: match.index,
                    start: {
                        year: getYear(startDate)
                    }
                })

            case "week":
                const endDate = endPeriodFunc(startDate, periodFuncParams)
                result = new ParsedResult({
                    ref,
                    text: match[0],
                    index: match.index,
                    start: {
                        year: getYear(startDate),
                        month: getMonth(startDate) + 1,
                        day: getDate(startDate)
                    },
                    end: {
                        year: getYear(endDate),
                        month: getMonth(endDate) + 1,
                        day: getDate(endDate)
                    }
                })
        }

        result.tags["ENSemanticPeriodParser"] = true

        return result
    }

    return relativeSemanticPeiodParser
}