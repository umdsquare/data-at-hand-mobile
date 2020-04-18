import { NLUOptions, makeVariableId } from "./types";
import compromise from 'compromise';
import { parseDurationTextToSeconds, extractTimeExpressions } from "./preprocessors/preprocessor-time";
import { inferVerbType } from "./preprocessors/preprocessor-verb";
import { categorizeExtreme, findComparisonTermInfo, inferScalarValue } from "./preprocessors/preprocessor-condition";
import { tryPreprocessingByTemplates, DATASOURCE_VARIABLE_RULES, CYCLIC_TIME_RULES } from "./preprocessors/preprocessor-templates";
import { parseTimeOfTheDayTextToDiffSeconds } from "./preprocessors/preprocessor-time-clock";
import { DataSourceType } from "@data-at-hand/core/measure/DataSourceSpec";
import { runPipe, definePipe } from "./preprocessors/preprosessor-pipe";
import { VariableType, PreProcessedInputText, VerbInfo, Intent, ConditionInfo } from "@data-at-hand/core/speech/types";

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
    'noon': 'Time',
    'midnight': 'Time'
}

export async function preprocess(speech: string, options: NLUOptions): Promise<PreProcessedInputText> {

    const t = Date.now()

    speech = speech.replace(/(\d),(\d)/g, '$1$2').toLowerCase()

    const quickPassWithTemplate = tryPreprocessingByTemplates(speech, options)
    if (quickPassWithTemplate) {
        console.log("Quick passed : ", speech)
        return quickPassWithTemplate
    }

    //Find time========================================================================================

    const pipeResult = await runPipe(speech,
        definePipe("extract-time-expressions", (input) => {
            const parsedTimeVariables = extractTimeExpressions(input.processedSpeech, options.getToday())
            parsedTimeVariables.forEach(variable => {
                const id = makeVariableId()
                input.variables[id] = {
                    id,
                    originalText: variable.text,
                    type: variable.type,
                    value: variable.value,
                    additionalInfo: variable.additionalInfo
                }
                input.processedSpeech = input.processedSpeech.substr(0, variable.index) + id + input.processedSpeech.substring(variable.index + variable.text.length, input.processedSpeech.length)
            })
            return input
        }),
        definePipe("extract-data-sources", (input) => {
            DATASOURCE_VARIABLE_RULES.concat(CYCLIC_TIME_RULES).forEach(rule => {
                input.processedSpeech = input.processedSpeech.replace(rule.regex, (match) => {
                    const id = makeVariableId()
                    input.variables[id] = {
                        id,
                        originalText: match,
                        type: rule.variableType,
                        value: rule.value
                    }
                    return id
                })
            })
            return input
        }),
        definePipe("forward-nlp", (input) => {

            const nlp = compromise(input.processedSpeech, lexicon)

            nlp.match("compare").unTag("Date").unTag("Time").unTag("Duration").tag("Verb")

            //Tag all the inferred variables
            Object.keys(input.variables).forEach(id => {
                tag(nlp.match(id), input.variables[id].type)
            })

            const nlpCasted = (nlp as any)

            nlpCasted.numbers().toCardinal().toNumber()

            console.log(nlp.termList())

            input.payload.nlp = nlp
            input.processedSpeech = nlp.text()

            return input
        }),
        definePipe("extract-verbs", (input) => {
            const verbs = input.payload.nlp.verbs().match("!#Modal").first().toLowerCase().verbs().toInfinitive()
            const verbsJson = verbs.json()
            if (verbsJson.length > 0) {
                const id = makeVariableId()
                input.variables[id] = {
                    value: {
                        root: verbsJson[0].text,
                        type: inferVerbType(verbsJson[0].text)
                    } as VerbInfo,
                    type: VariableType.Verb,
                    originalText: verbsJson[0].text,
                    id
                }

                tag(verbs.replaceWith(id), VariableType.Verb)

                input.intent = input.variables[id].value.type
            }
            input.processedSpeech = input.payload.nlp.text()
            return input
        }),
        definePipe("infer-highlight", async (input) => {
            const dataSourceVariableId = Object.keys(input.variables).find(key => input.variables[key].type === VariableType.DataSource)
            const inferredConditionInfoResult = await inferHighlight(input.payload.nlp, speech, dataSourceVariableId != null ? input.variables[dataSourceVariableId].value : null, options)
            if (inferredConditionInfoResult) {
                const id = makeVariableId()
                input.variables[id] = {
                    id,
                    originalText: inferredConditionInfoResult.match.text(),
                    type: VariableType.Condition,
                    value: inferredConditionInfoResult.conditionInfo
                }
                tag(inferredConditionInfoResult.match.replaceWith(id), VariableType.Condition)
                input.processedSpeech = input.payload.nlp.text()
                input.intent = Intent.Highlight
            }
            return input
        })
    )

    //====================================================================================================
    console.log("Preprocessing: elapsed - ", Date.now() - t)

    return {
        processed: pipeResult.processedSpeech,
        original: speech,
        variables: pipeResult.variables,
        intent: pipeResult.intent || Intent.AssignTrivial
    }
}

function isBedtimeReferred(speech: string): boolean {
    return /(slept)|(bed)|(asleep)|(start)/gi.test(speech)
}

function isWaketimeReferred(speech: string): boolean {
    return /(wake)|(woke)|(g(o|e)t(ting)?\s+up)/gi.test(speech)
}

async function inferHighlight(nlp: compromise.Document, original: string, guidedDataSource: DataSourceType | undefined, options: NLUOptions): Promise<{ conditionInfo: ConditionInfo, match: compromise.Document } | null> {
    //try to find the condition
    console.log("infer highlight")
    const durationComparisonMatch = nlp.match(`[<comparison>(#Adverb|#Adjective)] than [<duration>(#Duration|#Date|#Time)(#Cardinal|#Duration|#Date|#Time|am|pm|hour|hours|minute|minutes)+?]`)

    const durationComparisonInfo = normalizeCompromiseGroup(durationComparisonMatch.groups())
    if (durationComparisonInfo) {
        console.debug("duration comparison info found:", durationComparisonInfo)
        const comparisonTermInfo = findComparisonTermInfo(durationComparisonInfo.comparison)
        if (comparisonTermInfo) {
            if (comparisonTermInfo.valueType.indexOf("duration") !== -1) {
                console.debug("Treat as a duration")
                return {
                    conditionInfo: {
                        type: comparisonTermInfo.conditionType,
                        impliedDataSource: DataSourceType.HoursSlept,
                        ref: parseDurationTextToSeconds(durationComparisonInfo.duration),
                    } as ConditionInfo,
                    match: durationComparisonMatch
                }
            } else if (comparisonTermInfo.valueType.indexOf("time") !== -1) {
                console.debug("Treat as a time")
                const isBedtimePassed = isBedtimeReferred(original)
                const isWakeTimePassed = isWaketimeReferred(original)
                if (isBedtimePassed === true || isWakeTimePassed === true) {
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
        const numericComparisonMatch = nlp.match(`[<comparison>(#Adverb|#Adjective)] than? [<number>(#Value+)] [<unit>(#Noun&&!#${PARSED_TAG})?]`)
        const numericComparisonInfo = normalizeCompromiseGroup(numericComparisonMatch.groups())

        if (numericComparisonInfo) {
            //numeric condition
            console.debug("numeric comparison info found.", numericComparisonInfo)
            const comparisonTermInfo = findComparisonTermInfo(numericComparisonInfo.comparison)
            if (comparisonTermInfo) {
                const parseDecimalNumber = require('parse-decimal-number');
                for (const prioritizedValueType of comparisonTermInfo.valueType) {
                    switch (prioritizedValueType) {
                        case "duration":
                            console.debug("treated as duration")
                            return {
                                conditionInfo: {
                                    type: comparisonTermInfo.conditionType,
                                    impliedDataSource: DataSourceType.HoursSlept,
                                    ref: parseDurationTextToSeconds([numericComparisonInfo.number, numericComparisonInfo.unit].join(" "))
                                } as ConditionInfo,
                                match: numericComparisonMatch
                            }
                        case "time":
                            {
                                console.debug("treated as time")
                                const isBedtimePassed = isBedtimeReferred(original)
                                const isWakeTimePassed = isWaketimeReferred(original)
                                if (isBedtimePassed === true || isWakeTimePassed === true) {
                                    return {
                                        conditionInfo: {
                                            type: comparisonTermInfo.conditionType,
                                            impliedDataSource: DataSourceType.SleepRange,
                                            propertyKey: isBedtimePassed === true ? 'bedtime' : (isWakeTimePassed === true ? 'waketime' : undefined),
                                            ref: parseTimeOfTheDayTextToDiffSeconds([numericComparisonInfo.number, numericComparisonInfo.unit].join(" "), isBedtimePassed === true ? 'night' : (isWakeTimePassed === true ? 'day' : undefined)),
                                        },
                                        match: durationComparisonMatch
                                    }
                                }
                            }
                            break;
                        case "scalar":
                            console.debug("treated as scalar")
                            const impliedDataSource = comparisonTermInfo.impliedSource || guidedDataSource
                            return {
                                conditionInfo: {
                                    type: comparisonTermInfo.conditionType,
                                    impliedDataSource,
                                    ref: impliedDataSource != null ?
                                        inferScalarValue(parseDecimalNumber(numericComparisonInfo.number),
                                            numericComparisonInfo.unit, impliedDataSource, options.measureUnit)
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
            const goalComparisonMatch = nlp.match(`[<comparison>(#Adverb|#Adjective)] than * goal`)
            const goalComparisonInfo = normalizeCompromiseGroup(goalComparisonMatch.groups())
            if (goalComparisonInfo) {
                const comparisonTermInfo = findComparisonTermInfo(goalComparisonInfo.comparison)

                const dataSource = comparisonTermInfo.impliedSource || guidedDataSource
                if (dataSource != null) {
                    const goalValue = await options.getGoal(dataSource)
                    if (goalValue != null) {
                        return {
                            conditionInfo: {
                                type: comparisonTermInfo.conditionType,
                                impliedDataSource: comparisonTermInfo.impliedSource,
                                ref: goalValue
                            } as ConditionInfo,
                            match: goalComparisonMatch
                        }
                    }
                }

            }

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