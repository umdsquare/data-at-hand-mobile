import { NLUOptions, makeVariableId } from "../types";
import { DateTimeHelper } from "@data-at-hand/core/utils/time";
import NamedRegExp from 'named-regexp-groups'
import { DataSourceType } from "@data-at-hand/core/measure/DataSourceSpec";
import { CyclicTimeFrame } from "@data-at-hand/core/exploration/CyclicTimeFrame";
import { VariableType, Intent, PreProcessedInputText } from '@data-at-hand/core/speech/types';

const REGEX_RANDOM_ELEMENT = "[a-zA-Z0-9\\s]+"

const PRONOUNS_REGEX = /^(this|it|that|these|them)(\s+(ones?|things?|elements?))?$/i

export type VariableParsingRule = { regex: RegExp | (() => RegExp), variableType: VariableType, value: any }

export function parseVariable(text: string, rules: Array<VariableParsingRule>): { info: { type: VariableType, value: any }, index: number, length: number } | null {
    for (const rule of rules) {
        const match = text.match((rule.regex as any)["test"] != null ? (rule.regex as any) : ((rule.regex as any)()))
        if (match != null) {
            return {
                info: {
                    type: rule.variableType,
                    value: rule.value
                },
                index: match.index,
                length: match[0].length
            }
        }
    }
    return null
}

export const STEP_COUNT_REGEX_STRING = "(step count(s|er)?)|(steps?)|(walk)"
export const WEIGHT_REGEX_STRING = "((body\\s+)?weight)|(wait)|(how heavy i (was|am))"
export const SLEEP_RANGE_REGEX_STRING = "(sleep(\\srange)?)|(range of ([a-z]+\\s)?sleep)|(sleep schedules?)"
export const HOURS_SLEPT_REGEX_STRING = "(h?ours?(\\s?)+(i|(of))?(\\s?)+((slept)|(sleep)))|(sleep length)|((length|duration) of ([a-z]+\\s)?sleep)|(sleep duration)|(sleep h?ours?)|(i (slept|sleep))"

export const DATASOURCE_VARIABLE_RULES: Array<VariableParsingRule> = [
    {
        regex: new RegExp(STEP_COUNT_REGEX_STRING, "i"),
        variableType: VariableType.DataSource,
        value: DataSourceType.StepCount
    },
    {
        regex: () => /((resting\s+)?heart rate)|(bpm)|(beats? per minutes?)/i,
        variableType: VariableType.DataSource,
        value: DataSourceType.HeartRate
    },
    {
        regex: new RegExp(HOURS_SLEPT_REGEX_STRING, "i"),
        variableType: VariableType.DataSource,
        value: DataSourceType.HoursSlept
    },
    {
        regex: new RegExp(SLEEP_RANGE_REGEX_STRING, "i"),
        variableType: VariableType.DataSource,
        value: DataSourceType.SleepRange,
    },
    {
        regex: new RegExp(WEIGHT_REGEX_STRING, "i"),
        variableType: VariableType.DataSource,
        value: DataSourceType.Weight
    }
]

export const CYCLIC_TIME_RULES: Array<VariableParsingRule> = [
    {
        regex: /(by\s+)?days?\s+of\s+(the\s+)?weeks?/i,
        variableType: VariableType.TimeCycle,
        value: CyclicTimeFrame.DayOfWeek
    },
    {
        regex: /(by\s+)?weekly(\s+(data|pattern))?(\s|$)?/i,
        variableType: VariableType.TimeCycle,
        value: CyclicTimeFrame.DayOfWeek
    },
    {
        regex: /(by months?)/i,
        variableType: VariableType.TimeCycle,
        value: CyclicTimeFrame.MonthOfYear
    },
    {
        regex: /(by\s+)?(months?\s+of\s+(the\s+)?years?)|(monthly(\s+(data|pattern))?)/i,
        variableType: VariableType.TimeCycle,
        value: CyclicTimeFrame.MonthOfYear
    },
    {
        regex: /(by\s+)?yearly(\s+(data|pattern))?(\s|$)?/i,
        variableType: VariableType.TimeCycle,
        value: CyclicTimeFrame.MonthOfYear
    },
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
    },/*
    {
        regex: new NamedRegExp(`(compare|compared|compel|compelled|(difference between))\\s+((?<dataSource>[a-zA-Z0-9\\s]+)\\s+(?<dataSourcePreposition>of|in|on|at)\\s+)?(?<compareA>${REGEX_RANDOM_ELEMENT})\\s+(?<conjunction>with|to|and)\\s+(?<compareB>${REGEX_RANDOM_ELEMENT})`, 'i'),
        parse: (groups: { compareA: string, compareB: string, conjunction: string, dataSource?: string, dataSourcePreposition?: string }, options) => {
            const today = options.getToday()

            console.log(groups)

            const variables = []

            let compareAOverride: string
            let compareBOverride: string

            if (groups.dataSource != null) {
                const parsedDataSourceInfo = parseVariable(groups.dataSource, DATASOURCE_VARIABLE_RULES)
                if (parsedDataSourceInfo) {
                    variables.push(parsedDataSourceInfo.info)
                    const afterPart = groups.dataSource.substring(parsedDataSourceInfo.index + parsedDataSourceInfo.length)
                    if(afterPart.length > 0){
                        compareAOverride = `${afterPart} ${groups.dataSourcePreposition} ${groups.compareA}`
                    }
                } else {
                    //maybe it could be merged into the time expression.
                    compareAOverride = `${groups.dataSource} ${groups.dataSourcePreposition} ${groups.compareA}`
                }
            } else {
                //check the case dataSourcePreposition does not exist.
                {
                    const parsedDataSourceInfo = parseVariable(groups.compareA, DATASOURCE_VARIABLE_RULES)
                    if (parsedDataSourceInfo) {
                        variables.push(parsedDataSourceInfo.info)

                        //discard the data source text from the time expression
                        compareAOverride = groups.compareA.substring(0, parsedDataSourceInfo.index) + groups.compareA.substring(parsedDataSourceInfo.index + parsedDataSourceInfo.length)
                    }
                }
            }

            //check the case data source is mentioned at the end.
            {
                const parsedDataSourceInfo = parseVariable(groups.compareB, DATASOURCE_VARIABLE_RULES)
                if (parsedDataSourceInfo) {
                    variables.push(parsedDataSourceInfo.info)

                    //discard the data source text from the time expression
                    compareBOverride = groups.compareB.substring(0, parsedDataSourceInfo.index) + groups.compareB.substring(parsedDataSourceInfo.index + parsedDataSourceInfo.length)
                }
            }

            compareAOverride = compareAOverride || groups.compareA
            compareBOverride = compareBOverride || groups.compareB

            let timeVariables = []

            for (const elementText of [compareAOverride, compareBOverride]) {
                const timeParsingResult = parseTimeText(elementText, today, options)
                if (timeParsingResult) {
                    timeVariables.push(timeParsingResult)
                    continue;
                } else if (PRONOUNS_REGEX.test(elementText)) {
                    continue;
                } else {
                    const parsedDataSourceInfo = parseVariable(elementText, DATASOURCE_VARIABLE_RULES)
                    if (parsedDataSourceInfo) {
                        variables.push(parsedDataSourceInfo.info)
                        continue;
                    }
                }
            }

            if (timeVariables.length >= 2 && timeVariables[0].type != timeVariables[1].type) {
                //two time variables should be parsed in the same way.
                timeVariables = extractTimeExpressions(`${compareAOverride} and ${compareBOverride}`, today, options)
            }

            fastConcatTo(variables, timeVariables)

            if (variables.length > 0) {
                return {
                    intent: Intent.Compare,
                    variables
                }
            } else return null

        }
    }*/
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