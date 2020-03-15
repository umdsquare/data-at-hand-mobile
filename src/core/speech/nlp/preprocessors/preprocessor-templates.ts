import { PreProcessedInputText, Intent, MONTH_NAMES, VariableType, NLUOptions, makeVariableId } from "../types";
import { getMonth, setMonth, subYears, endOfMonth, startOfMonth } from "date-fns";
import { DateTimeHelper } from "../../../../time";
import NamedRegExp from 'named-regexp-groups'
import { parseTimeText } from "./preprocessor-time";
import { DataSourceType } from "../../../../measure/DataSourceSpec";
import { CyclicTimeFrame } from "../../../exploration/cyclic_time";

const REGEX_RANDOM_ELEMENT = "[a-zA-Z0-9\\s]+"

const PRONOUNS_REGEX = /^(this|it|that|these|them)(\s+(ones?|things?|elements?))?$/i

export type VariableParsingRule = { regex: RegExp, variableType: VariableType, value: any }

export function parseVariable(text: string, rules: Array<VariableParsingRule>): { type: VariableType, value: any } | null {
    for (const rule of rules) {
        if (rule.regex.test(text)) {
            return {
                type: rule.variableType,
                value: rule.value
            }
        }
    }
    return null
}

export const DATASOURCE_VARIABLE_RULES: Array<VariableParsingRule> = [
    {
        regex: /(step count(s|er)?)|(steps?)|(walk)/gi,
        variableType: VariableType.DataSource,
        value: DataSourceType.StepCount
    },
    {
        regex: /((resting\s+)?heart rate)|(bpm)|(beats? per minutes?)/gi,
        variableType: VariableType.DataSource,
        value: DataSourceType.HeartRate
    },
    {
        regex: /(h?ours?(\s?)+(i|(of))?(\s?)+((slept)|(sleep)))|(sleep length)|((length|duration) of ([a-z]+\s)?sleep)|(sleep duration)|(sleep h?ours?)|(i (slept|sleep))/gi,
        variableType: VariableType.DataSource,
        value: DataSourceType.HoursSlept
    },
    {
        regex: /(sleep(\srange)?)|(range of ([a-z]+\s)?sleep)|(sleep schedules?)/gi,
        variableType: VariableType.DataSource,
        value: DataSourceType.SleepRange,
    },
    {
        regex: /((body\s+)?weight)|(how heavy i (was|am))/gi,
        variableType: VariableType.DataSource,
        value: DataSourceType.Weight
    }
]

export const CYCLIC_TIME_RULES: Array<VariableParsingRule> = [
    {
        regex: /days?\s+of\s+(the\s+)?weeks?/gi,
        variableType: VariableType.TimeCycle,
        value: CyclicTimeFrame.DayOfWeek
    },
    {
        regex: /(months?\s+of\s+(the\s+)?years?)|(monthly pattern)|(by months?)/gi,
        variableType: VariableType.TimeCycle,
        value: CyclicTimeFrame.MonthOfYear
    }
]

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
        regex: new NamedRegExp(`(compare|compel|(difference between))\\s+(?<compareA>${REGEX_RANDOM_ELEMENT})\\s+(with|to|and)\\s+(?<compareB>${REGEX_RANDOM_ELEMENT})`, 'i'),
        parse: (groups: { compareA: string, compareB: string }, options) => {
            const today = options.getToday()

            const variables = []
            for (const elementText of [groups.compareA, groups.compareB]) {
                const timeParsingResult = parseTimeText(elementText, today)
                if (timeParsingResult) {
                    variables.push(timeParsingResult)
                    continue;
                } else if (PRONOUNS_REGEX.test(elementText)) {
                    continue;
                } else {
                    const parsedDataSourceInfo = parseVariable(elementText, DATASOURCE_VARIABLE_RULES)
                    if (parsedDataSourceInfo) {
                        variables.push(parsedDataSourceInfo)
                        continue;
                    }
                }
            }

            if (variables.length > 0) {
                return {
                    intent: Intent.Compare,
                    variables
                }
            } else return null

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