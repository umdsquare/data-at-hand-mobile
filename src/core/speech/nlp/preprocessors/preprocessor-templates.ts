import { NLUOptions, makeVariableId } from "../types";
import { DateTimeHelper } from "@data-at-hand/core/utils/time";
import NamedRegExp from 'named-regexp-groups'
import { parseTimeText } from "./preprocessor-time";
import { DataSourceType } from "@data-at-hand/core/measure/DataSourceSpec";
import { CyclicTimeFrame } from "@data-at-hand/core/exploration/CyclicTimeFrame";
import { VariableType, Intent, PreProcessedInputText } from '@data-at-hand/core/speech/types';

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
        regex: new NamedRegExp("^(year\\s+)?(?<year>[12]\\d{3})$", "i"),
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
        regex: new NamedRegExp(`(compare|compel|(difference between))\\s+((?<dataSource>[a-zA-Z0-9\\s]+)\\s+(?<dataSourcePreposition>of|in|on|at)\\s+)?(?<compareA>${REGEX_RANDOM_ELEMENT})\\s+(with|to|and)\\s+(?<compareB>${REGEX_RANDOM_ELEMENT})`, 'i'),
        parse: (groups: { compareA: string, compareB: string, dataSource?: string }, options) => {
            const today = options.getToday()
            
            const variables = []

            if (groups.dataSource != null) {
                const parsedDataSourceInfo = parseVariable(groups.dataSource, DATASOURCE_VARIABLE_RULES)
                if (parsedDataSourceInfo) {
                    variables.push(parsedDataSourceInfo)
                }
            }


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