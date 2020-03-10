import { PreProcessedInputText, VariableType, VariableInfo, VariableInfoDict, VerbInfo, NLUOptions, Intent, ConditionInfo } from "./types";
import compromise from 'compromise';
import { DataSourceType } from "../../../measure/DataSourceSpec";
import { parseTimeText, parseDateTextToNumberedDate, parseTimeOfTheDayTextToDiffSeconds, parseDurationTextToSeconds } from "./preprocessors/preprocessor-time";
import { DateTimeHelper } from "../../../time";
import { subDays, subWeeks, subMonths, addDays, subYears, isSameMonth, getMonth, setMonth, startOfMonth, endOfMonth, endOfWeek, startOfWeek } from "date-fns";
import { randomString } from "../../../utils";
import { inferVerbType } from "./preprocessors/preprocessor-verb";
import { CyclicTimeFrame } from "../../exploration/cyclic_time";
import { categorizeExtreme, findComparisonTermInfo } from "./preprocessors/preprocessor-condition";

const PARSED_TAG = "ReplacedId"

function tag(doc: compromise.Document, variableType: VariableType): compromise.Document {
    return doc.tag(variableType).tag(PARSED_TAG)
}

function makeId() {
    return randomString(5)
}

function normalizeCompromiseGroup(groups: { [groupName: string]: compromise.Document }): any | null {
    const keyNames = Object.keys(groups)
    if (keyNames.length > 0) {
        const obj: any = {}
        keyNames.forEach(keyName => {
            const phrase = groups[keyName].list[0]
            const originalText = phrase.terms().map(t => t.text).join(" ")
            obj[keyName] = originalText
        })
        return obj
    } else return null
}

const lexicon = {
    'highlight': 'Verb',
    'compare': 'Verb',
    'compared': 'Verb'
}

const MONTH_NAMES = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
const MONTH_NAMES_WHOLE_REGEX = new RegExp(`^(${MONTH_NAMES.join("|")})$`, 'gi')
const MONTH_NAMES_REGEX = new RegExp(`${MONTH_NAMES.join("|")}`, 'gi')

type Rules = Array<{ regex: RegExp, variableType: VariableType, value: any }>

const DATASOURCE_VARIABLE_RULES: Rules = [
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

    let intent: Intent | undefined = undefined

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

            intent = Intent.AssignTrivial

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
        const nlp = compromise(processedSpeech, lexicon)

        nlp.match("compare").unTag("Date").unTag("Time").unTag("Duration").tag("Verb")

        //Tag all the inferred variables
        Object.keys(variables).forEach(id => {
            tag(nlp.match(id), variables[id].type)
        })

        const nlpCasted = (nlp as any)

        nlpCasted.numbers().toCardinal().toNumber()

        TIME_EXPRESSION_MATCH_SYNTAX.forEach(matchSyntaxElm => {
            const matches = nlp.match(matchSyntaxElm.matchSyntax)
            matches.forEach(match => {
                const matchedGroup = match.groups()
                const obj = normalizeCompromiseGroup(matchedGroup)
                if (obj) {
                    const id = makeId()
                    const parseResult = matchSyntaxElm.valueParser(obj, options)
                    if (parseResult) {
                        variables[id] = {
                            value: parseResult.value,
                            type: parseResult.type,
                            id,
                            originalText: match.text()
                        }
                        tag(match.replaceWith(id), parseResult.type).tag("Date")
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

        nlpCasted.dates().forEach(match => {
            const text = match.text()
            const parseResult = parseTimeText(text, options.getToday())
            if (parseResult) {
                const id = makeId()
                variables[id] = {
                    value: parseResult.value,
                    type: parseResult.type,
                    originalText: text,
                    id
                }
                tag(match.replaceWith(id), parseResult.type)
            }
        })


        if (MONTH_NAMES_REGEX.test(nlp.text()) === true) {
            //month name was not parsed.
            tag(nlp.replace(`(${MONTH_NAMES_REGEX.source})`, (match: compromise.Phrase) => {
                const id = makeId()
                timeExpressionDict[id] = {
                    value: null,
                    originalText: match.terms().map(t => t.text).join(" "),
                    id
                }
                return id
            }).tag("Date").tag("Month"), VariableType.Period)
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
                tag(nlp.match(id), parseResult.type)
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

            tag(verbs.replaceWith(id), VariableType.Verb)

            intent = variables[id].value.type
        }

        //Infer highlight======================================================
        //if (nlp.match("(number of)? (the)? days?").json().length > 0 || intent === Intent.Highlight) {

        const inferredConditionInfoResult = inferHighlight(nlp, speech)
        if (inferredConditionInfoResult) {
            const id = makeId()
            variables[id] = {
                id,
                originalText: inferredConditionInfoResult.match.text(),
                type: VariableType.Condition,
                value: inferredConditionInfoResult.conditionInfo
            }
            tag(inferredConditionInfoResult.match.replaceWith(id), VariableType.Condition)
            intent = Intent.Highlight
        }

        //}

        processedText = nlp.text()

    }

    //====================================================================================================
    console.log("Preprocessing: elapsed - ", Date.now() - t)

    return {
        processed: processedText,
        original: speech,
        variables,
        intent: intent || Intent.AssignTrivial
    }
}

function isBedtimeReferred(speech: string): boolean {
    return /(bed)|(asleep)|(start)/gi.test(speech)
}

function isWaketimeReferred(speech: string): boolean {
    return /(wake)|(woke)|(g(o|e)t(ting)?\s+up)/gi.test(speech)
}

function inferHighlight(nlp: compromise.Document, original: string): { conditionInfo: ConditionInfo, match: compromise.Document } | null {
    //try to find the condition

    const durationComparisonMatch = nlp.match(`[<comparison>(#Adverb|#Adjective)] than [<duration>(#Duration|#Date|#Time)(#Cardinal|#Duration|#Date|#Time)+]`)
    const durationComparisonInfo = normalizeCompromiseGroup(durationComparisonMatch.groups())
    if (durationComparisonInfo) {
        console.log("duration comparison info found:", durationComparisonInfo)
        const comparisonTermInfo = findComparisonTermInfo(durationComparisonInfo.comparison)
        if (comparisonTermInfo) {
            if (comparisonTermInfo.valueType.indexOf("duration") !== -1) {
                console.log("Treat as a duration")
                return {
                    conditionInfo: {
                        type: comparisonTermInfo.conditionType,
                        ref: parseDurationTextToSeconds(durationComparisonInfo.duration),
                    },
                    match: durationComparisonMatch
                }
            } else if (comparisonTermInfo.valueType.indexOf("time") !== -1) {
                console.log("Treat as a time")
                const isBedtimePassed = isBedtimeReferred(original)
                const isWakeTimePassed = isWaketimeReferred(original)
                if (isBedtimePassed || isWakeTimePassed) {
                    return {
                        conditionInfo: {
                            type: comparisonTermInfo.conditionType,
                            property: isBedtimePassed === true ? 'bedtime' : (isWakeTimePassed === true ? 'waketime' : undefined),
                            ref: parseTimeOfTheDayTextToDiffSeconds(durationComparisonInfo.duration, isBedtimePassed === true ? 'night' : (isWakeTimePassed === true ? 'day' : undefined)),
                        },
                        match: durationComparisonMatch
                    }
                }
            }

        }
    }
    else {
        const numericComparisonMatch = nlp.match(`[<comparison>(#Adverb|#Adjective)] than [<number>#Value] [<unit>(#Noun&&!#${PARSED_TAG})?]`)
        const numericComparisonInfo = normalizeCompromiseGroup(numericComparisonMatch.groups())
        if (numericComparisonInfo) {
            numericComparisonInfo.number = Number.parseInt(numericComparisonInfo.number.replace(",", ""))
            //numeric condition
            console.log("numeric comparison info found.", numericComparisonInfo)
            const comparisonTermInfo = findComparisonTermInfo(numericComparisonInfo.comparison)
            if (comparisonTermInfo) {
                return {
                    conditionInfo: {
                        type: comparisonTermInfo.conditionType,
                        ref: numericComparisonInfo.number,
                        unit: numericComparisonInfo.unit
                    } as ConditionInfo,
                    match: numericComparisonMatch
                }
            }
        } else {
            const match = nlp.match("[<extreme>(max|maximum|min|minimum|earliest|latest|slowest|fastest|most|least)]")
            const extremeInfo = normalizeCompromiseGroup(match.groups())
            if (extremeInfo) {
                const category = categorizeExtreme(extremeInfo.extreme)
                if (category) {

                    const isBedtimePassed = isBedtimeReferred(original)
                    const isWakeTimePassed = isWaketimeReferred(original)

                    return {
                        conditionInfo: {
                            type: category,
                            property: isBedtimePassed === true ? 'bedtime' : (isWakeTimePassed === true ? 'waketime' : undefined)
                        } as ConditionInfo,
                        match
                    }
                }
            }
        }
    }
    return null
}

export async function test() {

    /*await preprocess("Show my resting heart rate from the last sunday to February 5")
    await preprocess("Show my resting heart rate for recent tenth days")
    await preprocess("Show my resting heart rate since the last Thanksgiving")
    await preprocess("Step count of the last Martin Luther King day")
    await preprocess("May I go to the step count from March to May")
    await preprocess("May I go to the step count from March to June")
    await preprocess("Went to the step count from the last March through May")
    await preprocess("I want more than 10,000 steps", { getToday: () => new Date() })
    await preprocess("What's the days I slept shorter than 8 and a half hours", { getToday: () => new Date() })
    await preprocess("What's the days I woke up earlier than half past ten", { getToday: () => new Date() })
    await preprocess("What's the day with the maximum step count", { getToday: () => new Date() })
    */

}