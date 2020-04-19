import { DataSourceType, MeasureUnitType } from "@data-at-hand/core/measure/DataSourceSpec"
import convert from "convert-units"
import { DataSourceManager } from "@measure/DataSourceManager"
import { NumericConditionType } from "@data-at-hand/core/exploration/ExplorationInfo"
import { parseDurationTextToSeconds } from "./preprocessor-time"
import compromise from 'compromise';
import { ConditionInfo } from "@data-at-hand/core/speech/types"
import { parseTimeOfTheDayTextToDiffSeconds } from "./preprocessor-time-clock"
import { NLUOptions, PARSED_TAG } from "../types"

type TermInfo = { term: string, conditionType: NumericConditionType, valueType: Array<"scalar" | "duration" | "time"> | null, impliedSource: DataSourceType | null }

const lexicon: Array<TermInfo> = [
    { term: 'earl', conditionType: NumericConditionType.Less, valueType: ["time"], impliedSource: DataSourceType.SleepRange },
    { term: 'late', conditionType: NumericConditionType.More, valueType: ["time"], impliedSource: DataSourceType.SleepRange },

    { term: 'low', conditionType: NumericConditionType.Less, valueType: ["scalar"], impliedSource: null, },
    { term: 'high', conditionType: NumericConditionType.More, valueType: ["scalar"], impliedSource: null, },

    { term: 'under', conditionType: NumericConditionType.Less, valueType: ["scalar"], impliedSource: null, },
    { term: 'below', conditionType: NumericConditionType.Less, valueType: ["scalar"], impliedSource: null, },
    { term: 'over', conditionType: NumericConditionType.More, valueType: ["scalar"], impliedSource: null, },

    { term: 'short', conditionType: NumericConditionType.Less, valueType: ["duration"], impliedSource: DataSourceType.HoursSlept },
    { term: 'long', conditionType: NumericConditionType.More, valueType: ["duration"], impliedSource: DataSourceType.HoursSlept },

    { term: 'less', conditionType: NumericConditionType.Less, valueType: ["scalar", "duration"], impliedSource: null },
    { term: 'more', conditionType: NumericConditionType.More, valueType: ["scalar", 'duration'], impliedSource: null },

    { term: 'slow', conditionType: NumericConditionType.Less, valueType: ["scalar"], impliedSource: DataSourceType.HeartRate },
    { term: 'fast', conditionType: NumericConditionType.More, valueType: ["scalar"], impliedSource: DataSourceType.HeartRate },

    { term: 'light', conditionType: NumericConditionType.Less, valueType: ["scalar"], impliedSource: DataSourceType.Weight },
    { term: 'heav', conditionType: NumericConditionType.More, valueType: ["scalar"], impliedSource: DataSourceType.Weight },
]


function categorizeExtreme(extreme: string): NumericConditionType.Max | NumericConditionType.Min | null {
    if (/(max)|(maximum)|(latest)|(fastest)|(most)/gi.test(extreme)) {
        return NumericConditionType.Max
    } else if (/(min)|(minimum)|(earliest)|(slowest)|(least)/gi) {
        return NumericConditionType.Min
    } else return null
}

function findComparisonTermInfo(comparison: string): TermInfo | null {
    return lexicon.find(l => comparison.search(l.term) != -1)
}

function inferScalarValue(value: number, valueUnit: string | undefined, dataSource: DataSourceType, measureUnit: MeasureUnitType): number {
    switch (dataSource) {
        case DataSourceType.Weight:
            if (valueUnit) {
                if (valueUnit === 'kg' || valueUnit.startsWith('kilogram')) {
                    return value
                } else if (valueUnit === 'lb' || valueUnit.startsWith('pound')) {
                    return convert(value).from('lb').to('kg')
                }
            }
            //number only
            return Math.round(DataSourceManager.instance.convertValueReverse(value, dataSource, measureUnit))
        case DataSourceType.HoursSlept:
            return parseDurationTextToSeconds(valueUnit != null? (value + " " + valueUnit) : value.toString())
        default: return DataSourceManager.instance.convertValueReverse(value, dataSource, measureUnit)
    }
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

function isBedtimeReferred(speech: string): boolean {
    return /(slept)|(bed)|(asleep)|(start)/gi.test(speech)
}

function isWaketimeReferred(speech: string): boolean {
    return /(wake)|(woke)|(g(o|e)t(ting)?\s+up)/gi.test(speech)
}

export async function inferHighlight(nlp: compromise.Document, original: string, guidedDataSource: DataSourceType | undefined, options: NLUOptions): Promise<{ conditionInfo: ConditionInfo, match: compromise.Document } | null> {
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
            //check extreme
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

            //goal
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

            //goal accomplishment
            
        }
    }
    return null
}