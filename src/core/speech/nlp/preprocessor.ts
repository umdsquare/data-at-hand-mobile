import { PreProcessedInputText, VariableType, VariableInfo, VariableInfoDict, VerbInfo, NLUOptions } from "./types";
import compromise from 'compromise';
import { DataSourceType } from "../../../measure/DataSourceSpec";
import { parseTimeText, parseDateTextToNumberedDate } from "./preprocessors/preprocessor-time";
import { DateTimeHelper } from "../../../time";
import { subDays, subWeeks, subMonths, addDays, subYears, isSameMonth, getMonth, setMonth, startOfMonth, endOfMonth, endOfWeek, startOfWeek } from "date-fns";
import { randomString } from "../../../utils";
import { inferVerbType } from "./preprocessors/preprocessor-verb";
import { CyclicTimeFrame } from "../../exploration/cyclic_time";

function makeId(){
    return randomString(5)
}

const MONTH_NAMES = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
const MONTH_NAMES_WHOLE_REGEX = new RegExp(`^(${MONTH_NAMES.join("|")})$`, 'gi')
const MONTH_NAMES_REGEX = new RegExp(`${MONTH_NAMES.join("|")}`, 'gi')

type Rules = Array<{regex: RegExp, variableType: VariableType, value: any}>

const DATASOURCE_VARIABLE_RULES: Rules = [
    {
        regex: /(step count(s|er)?)|(steps?)/gi,
        variableType: VariableType.DataSource,
        value: DataSourceType.StepCount
    },
    {
        regex: /((resting\s+)?heart rate)|(bpm)|(beats? per minutes?)/gi,
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

const CYCLIC_TIME_RULES: Rules = [
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

const TIME_EXPRESSION_MATCH_SYNTAX: Array<{ matchSyntax: string, valueParser: (obj: any, options: NLUOptions) => { type: VariableType.Date | VariableType.Period, value: number | [number, number] } | null }> = [

    {
        matchSyntax: "[<relative>(last|past|previous|this)+] week",
        valueParser: (obj: { relative: string }, options) => {
            const relatives = obj.relative.replace(",", " ").toLowerCase().split(" ")
            const today = options.getToday()

            if (relatives.length === 1 || relatives.every(v => v === 'last') === false) {
                switch (relatives[0]) {
                    case "this":
                        return {
                            type: VariableType.Period,
                            value: [DateTimeHelper.toNumberedDateFromDate(startOfWeek(today, { weekStartsOn: 1 })),
                            DateTimeHelper.toNumberedDateFromDate(endOfWeek(today, { weekStartsOn: 1 }))]
                        }
                    default:
                        return {
                            type: VariableType.Period,
                            value: [DateTimeHelper.toNumberedDateFromDate(subDays(startOfWeek(today, { weekStartsOn: 1 }), 7)),
                            DateTimeHelper.toNumberedDateFromDate(subDays(endOfWeek(today, { weekStartsOn: 1 }), 7))]
                        }
                }
            } else {
                const numberOfLast = relatives.filter(r => r === 'last').length
                return {
                    type: VariableType.Period,
                    value: [DateTimeHelper.toNumberedDateFromDate(subDays(startOfWeek(today, { weekStartsOn: 1 }), 7 * numberOfLast)),
                    DateTimeHelper.toNumberedDateFromDate(subDays(endOfWeek(today, { weekStartsOn: 1 }), 7 * numberOfLast))]
                }
            }
        }
    },
    {
        matchSyntax: "since [<date>#Date+]",
        valueParser: (obj: { date: string }, options) => {
            const parsedDate = parseDateTextToNumberedDate(obj.date, options.getToday())
            if (parsedDate) {
                const today = options.getToday()
                return {
                    type: VariableType.Period,
                    value: [parsedDate, DateTimeHelper.toNumberedDateFromDate(today)]
                }
            } else return null
        }
    },
    {
        matchSyntax: "(recent|resent|resend|past|last) [<n>#Value] [<durationUnit>#Duration]",
        valueParser: (obj: { n: string, durationUnit: string }, options) => {
            const n = Number.parseInt(obj.n)
            if (n > 0) {
                const todayDate = options.getToday()
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
    {
        matchSyntax: `from? #Determiner? [<fromMonth>(last|past|previous|this)? (${MONTH_NAMES.join("|")})] (to|through) #Determiner? [<toMonth>(last|past|previous|this)? (${MONTH_NAMES.join("|")})]`,
        valueParser: (obj: { fromMonth: string, toMonth: string }, options) => {
            return parseTimeText(obj.fromMonth + " to " + obj.toMonth, options.getToday())
        }
    }
]

export async function preprocess(speech: string, options: NLUOptions): Promise<PreProcessedInputText> {
    const t = Date.now()

    const variables: VariableInfoDict = {}

    let quickPass = false

    let processedText: string | undefined = undefined

    //Check for quickpass=================================================
    {
        if (MONTH_NAMES_WHOLE_REGEX.test(speech)) {
            //month
            const month = MONTH_NAMES.indexOf(speech.toLowerCase())
            const today = options.getToday()
            const todayMonth = getMonth(today)
            let monthDate: Date

            if (month <= todayMonth) {
                //same year
                monthDate = setMonth(today, month)
            } else {
                monthDate = subYears(setMonth(today, month), 1)
            }

            const id = makeId()
            processedText = id
            variables[id] = {
                id,
                originalText: speech,
                type: VariableType.Period,
                value: [DateTimeHelper.toNumberedDateFromDate(startOfMonth(monthDate)), DateTimeHelper.toNumberedDateFromDate(endOfMonth(monthDate))]
            }

            quickPass = true
        }
    }
    //=======================================
    if (quickPass === false) {
        //Find data source=================================================================================
        let processedSpeech = speech
        DATASOURCE_VARIABLE_RULES.concat(CYCLIC_TIME_RULES).forEach(rule => {
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
                    const parseResult = matchSyntaxElm.valueParser(obj, options)
                    if (parseResult) {
                        variables[id] = {
                            value: parseResult.value,
                            type: parseResult.type,
                            id,
                            originalText: match.text()
                        }
                        match.replaceWith(id).tag(parseResult.type).tag("Date")
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
            return id
        }).tag("Date")

        if(MONTH_NAMES_REGEX.test(nlp.text()) === true){
            //month name was not parsed.
            nlp.replace(`(${MONTH_NAMES_REGEX.source})`, (match: compromise.Phrase) => {
                const id = makeId()
                timeExpressionDict[id] = {
                    value: null,
                    originalText: match.terms().map(t => t.text).join(" "),
                    id
                }
                return id
            }).tag("Date").tag("Month").tag(VariableType.Period)
        }

        Object.keys(timeExpressionDict).forEach(id => {
            const elm = timeExpressionDict[id]
            const parseResult = parseTimeText(elm.originalText, options.getToday())
            if (parseResult) {
                variables[id] = {
                    value: parseResult.value,
                    type: parseResult.type,
                    originalText: elm.originalText,
                    id
                }
                nlp.match(id).tag(parseResult.type)
            }
        })

        //Find Verb========================================================
        const verbs = nlp.verbs().match("!#Modal").first().toLowerCase().verbs().toInfinitive()
        const verbsJson = verbs.json()
        if (verbsJson.length > 0) {
            const id = makeId()
            variables[id] = {
                value: {
                    root: verbsJson[0].text,
                    type: inferVerbType(verbsJson[0].text)
                } as VerbInfo,
                type: VariableType.Verb,
                originalText: verbsJson[0].text,
                id
            }

            verbs.replaceWith(id).tag(VariableType.Verb)
        }

        processedText = nlp.text()

    }

    //====================================================================================================
    console.log("Preprocessing: elapsed - ", Date.now() - t)

    return {
        processed: processedText,
        original: speech,
        variables
    }
}

export async function test() {
    /*
        await preprocess("Show my resting heart rate from the last sunday to February 5")
        await preprocess("Show my resting heart rate for recent tenth days")
        await preprocess("Show my resting heart rate since the last Thanksgiving")
        await preprocess("Step count of the last Martin Luther King day")
        await preprocess("May I go to the step count from March to May")
        await preprocess("May I go to the step count from March to June")
        await preprocess("Went to the step count from the last March through May")
        */
}