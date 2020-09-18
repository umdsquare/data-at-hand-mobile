import { NLUOptions, makeVariableId, PARSED_TAG } from "./types";
import compromise from 'compromise';
import { extractTimeExpressions } from "./preprocessors/preprocessor-time";
import { inferVerbType } from "./preprocessors/preprocessor-verb";
import { tryPreprocessingByTemplates, DATASOURCE_VARIABLE_RULES, CYCLIC_TIME_RULES } from "./preprocessors/preprocessor-templates";
import { runPipe, definePipe } from "./preprocessors/preprosessor-pipe";
import { VariableType, PreProcessedInputText, VerbInfo, Intent } from "@data-at-hand/core/speech/types";
import { inferHighlight } from "./preprocessors/preprocessor-condition";
import { NumericConditionType } from "@data-at-hand/core/exploration/ExplorationInfo";
import { DataSourceType } from "@data-at-hand/core";

compromise.extend(require('compromise-numbers'))

function tag(doc: compromise.Document, variableType: VariableType): compromise.Document {
    return doc.tag(variableType).tag(PARSED_TAG)
}

const lexicon = {
    'highlight': 'Verb',
    'compare': 'Verb',
    'compared': 'Verb',
    'less': 'Adjective',
    'noon': 'Time',
    'midnight': 'Time'
}

export async function preprocess(speech: string, options: NLUOptions, guidedDataSource?: DataSourceType): Promise<PreProcessedInputText> {

    const t = Date.now()

    speech = speech.replace(/(\d),(\d)/g, '$1$2').toLowerCase()

    const quickPassWithTemplate = tryPreprocessingByTemplates(speech, options)
    if (quickPassWithTemplate) {
        console.log("Quick passed : ", speech)
        return quickPassWithTemplate
    }

    //Find time========================================================================================

    const pipeResult = await runPipe(speech,
        definePipe("extract-time-expressions", async (input) => {
            const parsedTimeVariables = extractTimeExpressions(input.processedSpeech, options.getToday(), options)
            let indexShift = 0
            parsedTimeVariables.forEach(variable => {
                const id = makeVariableId()
                input.variables[id] = {
                    id,
                    originalText: variable.text,
                    type: variable.type,
                    value: variable.value,
                    additionalInfo: variable.additionalInfo
                }
                input.processedSpeech = input.processedSpeech.substr(0, variable.index + indexShift) + id + input.processedSpeech.substring(variable.index + indexShift + variable.text.length, input.processedSpeech.length)
                indexShift += id.length - variable.text.length
            })
            return input
        }),
        definePipe("extract-data-sources", (input) => {
            DATASOURCE_VARIABLE_RULES.concat(CYCLIC_TIME_RULES).forEach(rule => {
                input.processedSpeech = input.processedSpeech.replace((rule.regex as any).test != null ? rule.regex : (rule.regex as any)(), (match) => {
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

            nlp.match("(#Duration|#Date|#Time|#Cardinal|#NumericValue) (am|pm)").tag("Time")

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
            const inferredConditionInfoResult = await inferHighlight(input.payload.nlp, speech, dataSourceVariableId != null ? input.variables[dataSourceVariableId].value : guidedDataSource, options)
            if (inferredConditionInfoResult) {
                const id = makeVariableId()
                input.variables[id] = {
                    id,
                    originalText: typeof inferredConditionInfoResult.match === 'string' ? typeof inferredConditionInfoResult.match : inferredConditionInfoResult.match.text(),
                    type: VariableType.Condition,
                    value: inferredConditionInfoResult.conditionInfo
                }
                if (typeof inferredConditionInfoResult.match !== 'string') {
                    tag(inferredConditionInfoResult.match.replaceWith(id), VariableType.Condition)
                } else {
                    //TODO tag and replace the goal accomplishment part.
                }

                input.processedSpeech = input.payload.nlp.text()
                input.intent = Intent.Query

                //check some nonsense cases
                if (inferredConditionInfoResult.conditionInfo.type === NumericConditionType.Max || inferredConditionInfoResult.conditionInfo.type === NumericConditionType.Min) {
                    //extreme case
                    const dataSourceVariableId = Object.keys(input.variables).find(id => input.variables[id].type === VariableType.DataSource)
                    if (dataSourceVariableId != null) {
                        const dataSource = input.variables[dataSourceVariableId]
                        if (dataSource.value === DataSourceType.SleepRange) {
                            if (inferredConditionInfoResult.conditionInfo.propertyKey == null) {
                                //if sleep range was specified but no clues for wake time / bed time
                                dataSource.value = DataSourceType.HoursSlept
                            }
                        } else {
                            inferredConditionInfoResult.conditionInfo.propertyKey = undefined
                        }
                    } else {
                        //if data source is not set, try to find it.
                        if (inferredConditionInfoResult.conditionInfo.propertyKey === 'bedtime' || inferredConditionInfoResult.conditionInfo.propertyKey === 'waketime') {
                            inferredConditionInfoResult.conditionInfo.impliedDataSource = DataSourceType.SleepRange
                        }
                    }
                }
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