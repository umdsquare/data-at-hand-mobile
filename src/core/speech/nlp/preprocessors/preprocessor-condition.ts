import { NumericConditionType } from "../../../exploration/types"
import { DataSourceType } from "../../../../measure/DataSourceSpec"

type TermInfo = { term: string, conditionType: NumericConditionType, valueType: Array<"scalar" | "duration" | "time"> | null, impliedSource: DataSourceType | null }

const lexicon: Array<TermInfo> = [
    { term: 'earl', conditionType: NumericConditionType.Less, valueType: ["time"], impliedSource: DataSourceType.SleepRange },
    { term: 'late', conditionType: NumericConditionType.More, valueType: ["time"], impliedSource: DataSourceType.SleepRange },
    
    { term: 'low', conditionType: NumericConditionType.Less, valueType: ["scalar"], impliedSource: null,},
    { term: 'high', conditionType: NumericConditionType.More, valueType: ["scalar"], impliedSource: null,},

    { term: 'under', conditionType: NumericConditionType.Less, valueType: ["scalar"], impliedSource: null,},
    { term: 'below', conditionType: NumericConditionType.Less, valueType: ["scalar"], impliedSource: null,},
    { term: 'over', conditionType: NumericConditionType.More, valueType: ["scalar"], impliedSource: null,},
    
    { term: 'short', conditionType: NumericConditionType.Less, valueType: ["duration"], impliedSource: DataSourceType.HoursSlept},
    { term: 'long', conditionType: NumericConditionType.More, valueType: ["duration"], impliedSource: DataSourceType.HoursSlept},
    
    { term: 'less', conditionType: NumericConditionType.Less, valueType: ["duration", "scalar"], impliedSource: null},
    { term: 'more', conditionType: NumericConditionType.More, valueType: ["duration", "scalar"], impliedSource: null},
    
    { term: 'slow', conditionType: NumericConditionType.Less, valueType: ["scalar"], impliedSource: DataSourceType.HeartRate},
    { term: 'fast', conditionType: NumericConditionType.More, valueType: ["scalar"], impliedSource: DataSourceType.HeartRate},
    
    { term: 'heav', conditionType: NumericConditionType.Less, valueType: ["scalar"], impliedSource: DataSourceType.Weight},
    { term: 'light', conditionType: NumericConditionType.More, valueType: ["scalar"], impliedSource: DataSourceType.Weight},
]

export function categorizeExtreme(extreme: string): NumericConditionType.Max | NumericConditionType.Min | null {
    if (/(max)|(maximum)|(latest)|(fastest)|(most)/gi.test(extreme)) {
        return NumericConditionType.Max
    } else if (/(min)|(minimum)|(earliest)|(slowest)|(least)/gi) {
        return NumericConditionType.Min
    } else return null
}

export function findComparisonTermInfo(comparison: string): TermInfo | null {
    return lexicon.find(l => comparison.search(l.term) != -1)
}