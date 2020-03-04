import { PreProcessedInputText, VariableType, VariableInfo, VariableInfoDict } from "./types";
import compromise from 'compromise';
import { DataSourceType } from "../../../measure/DataSourceSpec";
import { parseTimeText, parseDateTextToNumberedDate } from "./preprocessor-time";
import { DateTimeHelper } from "../../../time";
import { subDays, subWeeks, subMonths, addDays, subYears } from "date-fns";

const alphabets = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
function makeId(): string {
    return [1, 2, 3, 4, 5].map(n => alphabets.charAt(Math.random() * (alphabets.length - 1))).join('')
}

const DATASOURCE_VARIABLE_RULES = [
    {
        regex: /(step count(s|er)?)|(steps?)/gi,
        variableType: VariableType.DataSource,
        value: DataSourceType.StepCount
    },
    {
        regex: /((resting)? heart rate)|(bpm)|(beats? per minutes?)/gi,
        variableType: VariableType.DataSource,
        value: DataSourceType.HeartRate
    },
    {
        regex: /(hours i? slept)|(sleep length)|((length|duration) of ([a-z]+\s)?sleep)|(sleep duration)|(how (long|much) i (slept|sleep))/gi,
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

const TIME_EXPRESSION_MATCH_SYNTAX: Array<{ matchSyntax: string, valueParser: (obj: any) => { type: VariableType.Date | VariableType.Period, value: number | [number, number] } | null }> = [
    {
        matchSyntax: "since [<date>#Date+]",
        valueParser: (obj: { date: string }) => {
            const parsedDate = parseDateTextToNumberedDate(obj.date)
            if (parsedDate) {
                const today = new Date() //TODO reflect today func
                return {
                    type: VariableType.Period,
                    value: [parsedDate, DateTimeHelper.toNumberedDateFromDate(today)]
                }
            } else return null
        }
    },
    {
        matchSyntax: "recent .? [<n>#Value] [<durationUnit>#Duration]",
        valueParser: (obj: { n: string, durationUnit: string }) => {
            const n = Number.parseInt(obj.n)
            if (n > 0) {
                const todayDate = new Date() //TODO reflect today func
                let startDate
                if (/days?/gi.test(obj.durationUnit)) {
                    startDate = subDays(todayDate, n - 1)
                } else if (/weeks?/gi.test(obj.durationUnit)) {
                    startDate = addDays(subWeeks(todayDate, n), 1)
                } else if (/months?/gi.test(obj.durationUnit)) {
                    startDate = addDays(subMonths(todayDate, n), 1)
                } else if (/years?/gi.test(obj.durationUnit)) {
                    startDate = addDays(subYears(todayDate, n), 1)
                } else return null

                return {
                    type: VariableType.Period,
                    value: [DateTimeHelper.toNumberedDateFromDate(startDate), DateTimeHelper.toNumberedDateFromDate(todayDate)]
                }
            } else return null
        }
    },
]

export async function preprocess(speech: string): Promise<PreProcessedInputText> {
    const t = Date.now()

    const variables: VariableInfoDict = {}

    //Find data source=================================================================================
    let processedSpeech = speech
    DATASOURCE_VARIABLE_RULES.forEach(rule => {
        processedSpeech = processedSpeech.replace(rule.regex, (match) => {
            const id = makeId()
            variables[id] = {
                id,
                originalText: match,
                type: rule.variableType,
                value: rule.value
            }
            return id
        })
    })

    //Find date and period==================================================================================
    const nlp = compromise(processedSpeech)

    const nlpCasted = (nlp as any)

    nlpCasted.numbers().toCardinal().toNumber()

    console.log(nlp.termList())

    TIME_EXPRESSION_MATCH_SYNTAX.forEach(matchSyntaxElm => {
        const matches = nlp.match(matchSyntaxElm.matchSyntax)
        matches.forEach(match => {
            const matchedGroup = match.groups()
            const groupNames = Object.keys(matchedGroup)
            if (groupNames.length > 0) {
                const obj: any = {}
                groupNames.forEach(groupName => {

                    const phrase = matchedGroup[groupName].list[0]
                    const originalText = phrase.terms().map(t => t.text).join(" ")
                    obj[groupName] = originalText
                })
                const id = makeId()
                const parseResult = matchSyntaxElm.valueParser(obj)
                if (parseResult) {
                    variables[id] = {
                        value: parseResult.value,
                        type: parseResult.type,
                        id,
                        originalText: match.text()
                    }
                    match.replaceWith(id)
                }
            }
        })
    })


    const timeExpressionDict: {
        [id: string]: {
            value: any,
            originalText: string,
            id: string
        }
    } = {}

    nlpCasted.dates().replaceWith((match: compromise.Phrase) => {
        const id = makeId()
        timeExpressionDict[id] = {
            value: null,
            originalText: match.terms().map(t => t.text).join(" "),
            id
        }
        nlp.find
        return id
    })

    Object.keys(timeExpressionDict).forEach(id => {
        const elm = timeExpressionDict[id]
        const parseResult = parseTimeText(elm.originalText)
        if (parseResult) {
            variables[id] = {
                value: parseResult.value,
                type: parseResult.type,
                originalText: elm.originalText,
                id
            }
        }
    })

    //====================================================================================================

    console.log(timeExpressionDict)

    console.log("Preprocessing:", nlp.text(), " elapsed - ", Date.now() - t)
    return {
        processed: nlp.text(),
        original: speech,
        variables
    }
}

export async function test() {

    await preprocess("Show my resting heart rate from the last sunday to February 5")
    await preprocess("Show my resting heart rate for recent tenth days")
    await preprocess("Show my resting heart rate since the last Thanksgiving")
    await preprocess("Step count of the last Martin Luther King day")
    await preprocess("From March to May")
    
}