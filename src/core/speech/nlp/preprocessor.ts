import { PreProcessedInputText, VariableType, VariableInfoDict, VerbInfo, NLUOptions, Intent, ConditionInfo, makeVariableId } from "./types";
import compromise from 'compromise';
import { parseDurationTextToSeconds, extractTimeExpressions } from "./preprocessors/preprocessor-time";
import { inferVerbType } from "./preprocessors/preprocessor-verb";
import { categorizeExtreme, findComparisonTermInfo, inferScalarValue } from "./preprocessors/preprocessor-condition";
import { tryPreprocessingByTemplates, DATASOURCE_VARIABLE_RULES, CYCLIC_TIME_RULES } from "./preprocessors/preprocessor-templates";
import { parseTimeOfTheDayTextToDiffSeconds } from "./preprocessors/preprocessor-time-clock";
import { DataSourceType } from "@measure/DataSourceSpec";

compromise.extend(require('compromise-numbers'))

const PARSED_TAG = "ReplacedId"

function tag(doc: compromise.Document, variableType: VariableType): compromise.Document {
    return doc.tag(variableType).tag(PARSED_TAG)
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
    'compared': 'Verb',
    'less': 'Adjective',
    /*
    'near': 'Date',
    "new year": 'Date',
    'since': 'Date',
    "fall": 'Date',
    "spring": 'Date',

    "resent": 'Date',
    'recent': 'Date',

    "march": 'Date',
    'may': 'Date',
    //holidays
    "valentine": 'Date',
    "father": 'Date',
    "mother": 'Date',
    'labor': 'Date'*/
}

export async function preprocess(speech: string, options: NLUOptions): Promise<PreProcessedInputText> {

    const t = Date.now()

    speech = speech.replace(/(\d),(\d)/g, '$1$2').toLowerCase()

    const quickPassWithTemplate = tryPreprocessingByTemplates(speech, options)
    if (quickPassWithTemplate) {
        console.log("Quick passed : ", speech)
        return quickPassWithTemplate
    }


    const variables: VariableInfoDict = {}

    let processedText: string | undefined = undefined

    let intent: Intent | undefined = undefined
    
    let processedSpeech = speech

    //Find time========================================================================================
    const parsedTimeVariables = extractTimeExpressions(processedSpeech, options.getToday())
    parsedTimeVariables.forEach(variable => {
        const id = makeVariableId()
        variables[id] = {
            id,
            originalText: variable.text,
            type: variable.type,
            value: variable.value
        }
        processedSpeech = processedSpeech.substr(0, variable.index) + id + processedSpeech.substring(variable.index + variable.text.length, processedSpeech.length)
    })

    //Find data source=================================================================================

    DATASOURCE_VARIABLE_RULES.concat(CYCLIC_TIME_RULES).forEach(rule => {
        processedSpeech = processedSpeech.replace(rule.regex, (match) => {
            const id = makeVariableId()
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

    //Extract time expressions
    /*
        nlpCasted.dates().forEach((match: compromise.Document) => {
            const text = match.text()
            const parseResult = parseTimeText(text, options.getToday())
            if (parseResult) {
                const id = makeVariableId()
                variables[id] = {
                    value: parseResult.value,
                    type: parseResult.type,
                    originalText: parseResult.text,
                    id
                }
                tag(match.replaceWith(id), parseResult.type)
            }
        })*/

    //Find Verb========================================================
    const verbs = nlp.verbs().match("!#Modal").first().toLowerCase().verbs().toInfinitive()
    const verbsJson = verbs.json()
    if (verbsJson.length > 0) {
        const id = makeVariableId()
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

    const inferredConditionInfoResult = inferHighlight(nlp, speech, options)
    if (inferredConditionInfoResult) {
        const id = makeVariableId()
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
    return /(slept)|(bed)|(asleep)|(start)/gi.test(speech)
}

function isWaketimeReferred(speech: string): boolean {
    return /(wake)|(woke)|(g(o|e)t(ting)?\s+up)/gi.test(speech)
}

function inferHighlight(nlp: compromise.Document, original: string, options: NLUOptions): { conditionInfo: ConditionInfo, match: compromise.Document } | null {
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
                        impliedDataSource: DataSourceType.HoursSlept,
                        ref: parseDurationTextToSeconds(durationComparisonInfo.duration),
                    } as ConditionInfo,
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
                            impliedDataSource: DataSourceType.SleepRange,
                            propertyKey: isBedtimePassed === true ? 'bedtime' : (isWakeTimePassed === true ? 'waketime' : undefined),
                            ref: parseTimeOfTheDayTextToDiffSeconds(durationComparisonInfo.duration, isBedtimePassed === true ? 'night' : (isWakeTimePassed === true ? 'day' : undefined)),
                        } as ConditionInfo,
                        match: durationComparisonMatch
                    }
                }
            }

        }
    }
    else {
        const numericComparisonMatch = nlp.match(`[<comparison>(#Adverb|#Adjective)] than? [<number>#Value+] [<unit>(#Noun&&!#${PARSED_TAG})?]`)


        const numericComparisonInfo = normalizeCompromiseGroup(numericComparisonMatch.groups())
        if (numericComparisonInfo) {
            //numeric condition
            console.log("numeric comparison info found.", numericComparisonInfo)
            const comparisonTermInfo = findComparisonTermInfo(numericComparisonInfo.comparison)
            if (comparisonTermInfo) {
                const parseDecimalNumber = require('parse-decimal-number');
                for (const prioritizedValueType of comparisonTermInfo.valueType) {
                    switch (prioritizedValueType) {
                        case "duration":
                            console.log("treated as duration")
                            return {
                                conditionInfo: {
                                    type: comparisonTermInfo.conditionType,
                                    impliedDataSource: DataSourceType.HoursSlept,
                                    ref: parseDurationTextToSeconds(numericComparisonInfo.number)
                                } as ConditionInfo,
                                match: numericComparisonMatch
                            }
                        case "time":
                            {
                                console.log("treated as time")
                                const isBedtimePassed = isBedtimeReferred(original)
                                const isWakeTimePassed = isWaketimeReferred(original)
                                if (isBedtimePassed || isWakeTimePassed) {
                                    return {
                                        conditionInfo: {
                                            type: comparisonTermInfo.conditionType,
                                            impliedDataSource: DataSourceType.SleepRange,
                                            propertyKey: isBedtimePassed === true ? 'bedtime' : (isWakeTimePassed === true ? 'waketime' : undefined),
                                            ref: parseTimeOfTheDayTextToDiffSeconds(numericComparisonInfo.number, isBedtimePassed === true ? 'night' : (isWakeTimePassed === true ? 'day' : undefined)),
                                        },
                                        match: durationComparisonMatch
                                    }
                                }
                            }
                            break;
                        case "scalar":
                            console.log("treated as scalar")
                            return {
                                conditionInfo: {
                                    type: comparisonTermInfo.conditionType,
                                    impliedDataSource: comparisonTermInfo.impliedSource,
                                    ref: comparisonTermInfo.impliedSource ?
                                        inferScalarValue(parseDecimalNumber(numericComparisonInfo.number),
                                            numericComparisonInfo.unit, comparisonTermInfo.impliedSource, options.measureUnit)
                                        : parseDecimalNumber(numericComparisonInfo.number)
                                } as ConditionInfo,
                                match: numericComparisonMatch
                            }
                    }
                }

                return {
                    conditionInfo: {
                        type: comparisonTermInfo.conditionType,
                        impliedDataSource: comparisonTermInfo.impliedSource,
                        ref: comparisonTermInfo.impliedSource ?
                            inferScalarValue(parseDecimalNumber(numericComparisonInfo.number),
                                numericComparisonInfo.unit, comparisonTermInfo.impliedSource, options.measureUnit)
                            : parseDecimalNumber(numericComparisonInfo.number)
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
                            propertyKey: isBedtimePassed === true ? 'bedtime' : (isWakeTimePassed === true ? 'waketime' : undefined)
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
    //await preprocess("step count by day of the week", { getToday: () => new Date() })
    //await preprocess("2019", { getToday: () => new Date() })

}