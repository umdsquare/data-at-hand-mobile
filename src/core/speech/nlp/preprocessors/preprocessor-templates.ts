import { PreProcessedInputText, Intent, MONTH_NAMES, VariableType, NLUOptions, makeVariableId } from "../types";
import { getMonth, setMonth, subYears, endOfMonth, startOfMonth } from "date-fns";
import { DateTimeHelper } from "../../../../time";
import NamedRegExp from 'named-regexp-groups'
import { parseTimeText } from "./preprocessor-time";

const REGEX_RANDOM_ELEMENT = "[a-zA-Z0-9\\s]+"

interface Template {
    regex: NamedRegExp,
    parse: (groups: any, options: NLUOptions) => {
        intent: Intent,
        variables: Array<{ type: VariableType, value: any }>
    } | null
}

const templates: Array<Template> = [
    {
        regex: new NamedRegExp(`^(?<month>${MONTH_NAMES.join("|")})$`, 'i'),
        parse: (groups: { month: string }, options) => {
            const month = MONTH_NAMES.indexOf(groups.month.toLowerCase())
            const today = options.getToday()
            const todayMonth = getMonth(today)
            let monthDate: Date

            if (month <= todayMonth) {
                //same year
                monthDate = setMonth(today, month)
            } else {
                monthDate = subYears(setMonth(today, month), 1)
            }

            return {
                intent: Intent.AssignTrivial,
                variables: [{
                    type: VariableType.Period,
                    value: [DateTimeHelper.toNumberedDateFromDate(startOfMonth(monthDate)), DateTimeHelper.toNumberedDateFromDate(endOfMonth(monthDate))]
                }]
            }
        }
    },
    {
        regex: new NamedRegExp("^(year\\s+)?(?<year>\\d{4})$", "i"),
        parse: (groups: { year: string }, options) => {
            const year = Number.parseInt(groups.year)
            return {
                intent: Intent.AssignTrivial,
                variables: [{
                    type: VariableType.Period,
                    value: [
                        DateTimeHelper.toNumberedDateFromValues(year, 1, 1),
                        DateTimeHelper.toNumberedDateFromValues(year, 12, 31),
                    ]
                }]
            }
        }
    },
    {
        regex: new NamedRegExp(`^(compare|compel)\\s+(?<compareA>${REGEX_RANDOM_ELEMENT})\\s+(with|to|and)\\s+(?<compareB>${REGEX_RANDOM_ELEMENT})$`, 'i'),
        parse: (groups: { compareA: string, compareB: string }, options) => {
            const today = options.getToday()
            const aParseResult = parseTimeText(groups.compareA, today)
            const bParseResult = parseTimeText(groups.compareB, today)

            const variables = []
            if(aParseResult){
                variables.push(aParseResult)
            }
            if(bParseResult){
                variables.push(bParseResult)
            }

            return {
                intent: Intent.Compare,
                variables
            }
        }
    }
]

export function tryPreprocessingByTemplates(speech: string, options: NLUOptions): PreProcessedInputText | null {
    for (const template of templates) {

        const parsed = template.regex.exec(speech)
        if (parsed) {
            const result = template.parse(parsed.groups, options)
            if (result) {
                const variables: any = {}
                result.variables.forEach(v => {
                    const id = makeVariableId()
                    variables[id] = {
                        ...v,
                        id
                    }
                })

                return {
                    intent: result.intent,
                    original: speech,
                    processed: speech,
                    variables
                }
            }
        }
    }
    return null
}