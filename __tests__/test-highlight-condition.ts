/**
 * @format
 */

import { preprocess } from '@core/speech/nlp/preprocessor';
import { dataSources, speechOptions, HOURS_SLEPT_GOAL, STEP_COUNT_GOAL, WEIGHT_GOAL } from '../jest.setup';
import { DataSourceType } from '@data-at-hand/core/measure/DataSourceSpec';
import { NumericConditionType, Intent, VariableType } from '@data-at-hand/core';
import { ConditionInfo } from '@data-at-hand/core/speech/types';
import { fastConcatTo } from '@data-at-hand/core/utils';

console.log = jest.fn()

const prefixes = [
    "Highlight the days",
    "Count the days",
    "What are the days",
    "Number of days",
    "How many days",
    "days",
    ""
]

const goalWordPrefixes = ["", "my ", "the ", "a ", "current ", "a current ", "the current "]
const goalWords = ["goal", "gold"]

const conditions: Array<[string, DataSourceType, ConditionInfo]> = [
    ["I walked more than 1000", DataSourceType.StepCount, { ref: 1000, type: NumericConditionType.More }],
    ["with step count more than 5000", DataSourceType.StepCount, { ref: 5000, type: NumericConditionType.More }],

    ["with step count over 10,000 steps", DataSourceType.StepCount, { ref: 10000, type: NumericConditionType.More }],

    ["I was heavier than 150", DataSourceType.Weight, { ref: 150, type: NumericConditionType.More }],
    ["I was lighter than 150", DataSourceType.Weight, { ref: 150, type: NumericConditionType.Less }],
    ["with weight more than 100", DataSourceType.Weight, { ref: 100, type: NumericConditionType.More }],
    ["with weight higher than 100", DataSourceType.Weight, { ref: 100, type: NumericConditionType.More }],
    ["with weight lower than 100", DataSourceType.Weight, { ref: 100, type: NumericConditionType.Less }],


    ["I was lighter than the goal", DataSourceType.Weight, { ref: WEIGHT_GOAL, type: NumericConditionType.Less }],


    ["I slept less than five hours", DataSourceType.HoursSlept, { ref: 3600 * 5, type: NumericConditionType.Less }],
    ["I slept shorter than five hours", DataSourceType.HoursSlept, { ref: 3600 * 5, type: NumericConditionType.Less }],
    ["I slept more than five hours", DataSourceType.HoursSlept, { ref: 3600 * 5, type: NumericConditionType.More }],
    ["I slept longer than five hours", DataSourceType.HoursSlept, { ref: 3600 * 5, type: NumericConditionType.More }],
    ["I slept over five hours", DataSourceType.HoursSlept, { ref: 3600 * 5, type: NumericConditionType.More }],
    ["I slept above five hours", DataSourceType.HoursSlept, { ref: 3600 * 5, type: NumericConditionType.More }],
    ["I slept below five hours", DataSourceType.HoursSlept, { ref: 3600 * 5, type: NumericConditionType.Less }],


    ["I went to bed before 12 am", DataSourceType.SleepRange, { ref: 0, type: NumericConditionType.Less }],
    ["I went to bed earlier than 12 am", DataSourceType.SleepRange, { ref: 0, type: NumericConditionType.Less }],
    ["I went to bed earlier than 12:00 AM", DataSourceType.SleepRange, { ref: 0, type: NumericConditionType.Less }],
    ["I went to bed before 12 pm", DataSourceType.SleepRange, { ref: 3600 * 12, type: NumericConditionType.Less }],
    ["I went to bed earlier than 12 pm", DataSourceType.SleepRange, { ref: 3600 * 12, type: NumericConditionType.Less }],
    ["I went to bed earlier than 12:00 PM", DataSourceType.SleepRange, { ref: 3600 * 12, type: NumericConditionType.Less }],
    ["I went to bed earlier than 12", DataSourceType.SleepRange, { ref: 0, type: NumericConditionType.Less }],


    ["I woke up before 12 am", DataSourceType.SleepRange, { ref: 0, type: NumericConditionType.Less }],

    ["I went to bed before 10 o'clock", DataSourceType.SleepRange, { ref: -7200, type: NumericConditionType.Less }],
    ["I went to bed earlier than 10 o'clock", DataSourceType.SleepRange, { ref: -7200, type: NumericConditionType.Less }],
    ["I woke up earlier than 10 o'clock", DataSourceType.SleepRange, { ref: 3600 * 10, type: NumericConditionType.Less }],
    ["I woke up earlier than 7 o'clock", DataSourceType.SleepRange, { ref: 3600 * 7, type: NumericConditionType.Less }],
    ["I woke up earlier than seven o'clock", DataSourceType.SleepRange, { ref: 3600 * 7, type: NumericConditionType.Less }],

    ["I woke up after seven o'clock", DataSourceType.SleepRange, { ref: 3600 * 7, type: NumericConditionType.More }],


    ["I went to bed earlier than 11", DataSourceType.SleepRange, { ref: -3600, type: NumericConditionType.Less }],
    ["I went to bed earlier than Midnight", DataSourceType.SleepRange, { ref: 0, type: NumericConditionType.Less }],
    ["I got up later than Noon", DataSourceType.SleepRange, { ref: 3600 * 12, type: NumericConditionType.More }],
    ["I got up earlier than Noon", DataSourceType.SleepRange, { ref: 3600 * 12, type: NumericConditionType.Less }],
    ["I woke up later than 12", DataSourceType.SleepRange, { ref: 3600 * 12, type: NumericConditionType.More }],
    ["I woke up after 12", DataSourceType.SleepRange, { ref: 3600 * 12, type: NumericConditionType.More }],
]

goalWordPrefixes.forEach(goalWordPrefix => {
    goalWords.forEach(goalWord => {
        fastConcatTo(conditions, [
            [`with step count more than ${goalWordPrefix}${goalWord}`, DataSourceType.StepCount, { ref: STEP_COUNT_GOAL, type: NumericConditionType.More }],
            [`I walked over ${goalWordPrefix}${goalWord}`, DataSourceType.StepCount, { ref: STEP_COUNT_GOAL, type: NumericConditionType.More }],
            [`with step count over ${goalWordPrefix}${goalWord}`, DataSourceType.StepCount, { ref: STEP_COUNT_GOAL, type: NumericConditionType.More }],
            [`I slept less than ${goalWordPrefix}${goalWord}`, DataSourceType.HoursSlept, { ref: HOURS_SLEPT_GOAL, type: NumericConditionType.Less }],

            [`with step count above ${goalWordPrefix}${goalWord}`, DataSourceType.StepCount, { ref: STEP_COUNT_GOAL, type: NumericConditionType.More }],
            [`with step count below ${goalWordPrefix}${goalWord}`, DataSourceType.StepCount, { ref: STEP_COUNT_GOAL, type: NumericConditionType.Less }],
        ])
    })
})


describe("Inequation condition", () => {
    for (const prefix of prefixes) {
        describe("Prefix [" + prefix + "]", () => {
            for (const testcase of conditions) {
                it(testcase[0], async () => {
                    const result = await preprocess(prefix + " " + testcase[0], speechOptions)

                    let dataSourceId: string
                    let conditionId: string

                    Object.keys(result.variables).forEach(id => {
                        if(result.variables[id].type === VariableType.DataSource){
                            dataSourceId = id
                        }else if(result.variables[id].type === VariableType.Condition){
                            conditionId = id
                        }
                    })


                    let dataSource: DataSourceType
                    let condition: ConditionInfo

                    if (dataSourceId) {
                        dataSource = result.variables[dataSourceId].value
                    }
                    if (conditionId) {
                        condition = result.variables[conditionId].value
                    }

                    expect(condition).toBeDefined()

                    if (dataSource == null) {
                        dataSource = condition.impliedDataSource
                    }

                    expect(result.intent).toBe(Intent.Highlight)
                    expect(dataSource).toEqual(testcase[1])
                    expect(condition.type).toEqual(testcase[2].type)
                    expect(condition.ref).toEqual(testcase[2].ref)

                })
            }
        })
    }
})

//Goal
const goalAchieveVerbPresent = ["meet", "reach", "accomplish", "achieve"]
const goalAchieveVerbPast = ["met", "reached", "accomplished", "achieved"]

const goalTestSet: Array<[string, DataSourceType, ConditionInfo]> = []

prefixes.forEach(prefix => {
    ["failed to", "couldn't", "didn't", "could not", "did not"].map(auxiliary => {
        goalAchieveVerbPresent.forEach(presentVerb => {
            [
                ["", DataSourceType.StepCount, { ref: STEP_COUNT_GOAL, type: NumericConditionType.Less }],
                ["step ", DataSourceType.StepCount, { ref: STEP_COUNT_GOAL, type: NumericConditionType.Less }],
                ["step count ", DataSourceType.StepCount, { ref: STEP_COUNT_GOAL, type: NumericConditionType.Less }],
                ["sleep ", DataSourceType.HoursSlept, { ref: HOURS_SLEPT_GOAL, type: NumericConditionType.Less }],
                ["hours slept ", DataSourceType.HoursSlept, { ref: HOURS_SLEPT_GOAL, type: NumericConditionType.Less }],
                ["sleep duration ", DataSourceType.HoursSlept, { ref: HOURS_SLEPT_GOAL, type: NumericConditionType.Less }],
                ["weight ", DataSourceType.Weight, { ref: WEIGHT_GOAL, type: NumericConditionType.More }],
            ].forEach(entry => {
                goalWordPrefixes.forEach(goalWordPrefix => {
                    goalWords.forEach(goalWord => {
                        goalTestSet.push(
                            [
                                `${prefix} ${auxiliary} ${presentVerb} ${goalWordPrefix}${entry[0]}${goalWord}`,
                                entry[1] as DataSourceType,
                                entry[2] as ConditionInfo
                            ]
                        )
                    })
                })
            })
        })
    })
})

const postPreposition = ["of ", "for ", ""]

prefixes.forEach(prefix => {
    goalAchieveVerbPast.forEach(pastVerb => {
        [
            ["", DataSourceType.StepCount, { ref: STEP_COUNT_GOAL, type: NumericConditionType.More }],
            ["step ", DataSourceType.StepCount, { ref: STEP_COUNT_GOAL, type: NumericConditionType.More }],
            ["step count ", DataSourceType.StepCount, { ref: STEP_COUNT_GOAL, type: NumericConditionType.More }],
            ["sleep ", DataSourceType.HoursSlept, { ref: HOURS_SLEPT_GOAL, type: NumericConditionType.More }],
            ["hours slept ", DataSourceType.HoursSlept, { ref: HOURS_SLEPT_GOAL, type: NumericConditionType.More }],
            ["sleep duration ", DataSourceType.HoursSlept, { ref: HOURS_SLEPT_GOAL, type: NumericConditionType.More }],
            ["weight ", DataSourceType.Weight, { ref: WEIGHT_GOAL, type: NumericConditionType.Less }],
        ].forEach(entry => {
            goalWordPrefixes.forEach(goalWordPrefix => {
                goalWords.forEach(goalWord => {
                    goalTestSet.push(
                        [
                            `${prefix} ${pastVerb} ${goalWordPrefix}${entry[0]}${goalWord}`,
                            entry[1] as DataSourceType,
                            entry[2] as ConditionInfo
                        ]
                    )

                    postPreposition.forEach(preposition => {
                        goalTestSet.push(
                            [
                                `${prefix} ${pastVerb} ${goalWordPrefix}${goalWord} ${preposition}${entry[0]}`,
                                entry[1] as DataSourceType,
                                entry[2] as ConditionInfo
                            ]
                        )
                    })
                    
                })
            })
        })
    })
})

describe("Goal achievement condition", () => {
    for (const testcase of goalTestSet) {
        it(testcase[0], async () => {
            const result = await preprocess(testcase[0], speechOptions, DataSourceType.StepCount)

            const conditionId = Object.keys(result.variables).find(k => result.variables[k].type === VariableType.Condition)

            let condition: ConditionInfo
            if (conditionId) {
                condition = result.variables[conditionId].value
            }

            expect(condition).toBeDefined()

            expect(result.intent).toBe(Intent.Highlight)
            expect(condition.impliedDataSource).toEqual(testcase[1])
            expect(condition.type).toEqual(testcase[2].type)
            expect(condition.ref).toEqual(testcase[2].ref)
        })
    }
})


//

const directSentences: Array<[string, DataSourceType, ConditionInfo]> = [
    ["Lowest sleep range", DataSourceType.HoursSlept, { type: NumericConditionType.Min }],
    ["Earliest asleep time", DataSourceType.SleepRange, { propertyKey: "bedtime", type: NumericConditionType.Min }]

]

describe("Extreme condition", () => {
    for (const testcase of directSentences) {
        it(testcase[0], async () => {
            const result = await preprocess(testcase[0], speechOptions)

            
            let dataSourceId: string
            let conditionId: string

            Object.keys(result.variables).forEach(id => {
                if(result.variables[id].type === VariableType.DataSource){
                    dataSourceId = id
                }else if(result.variables[id].type === VariableType.Condition){
                    conditionId = id
                }
            })

            let dataSource: DataSourceType
            let condition: ConditionInfo
            if (dataSourceId) {
                dataSource = result.variables[dataSourceId].value
            }
            if (conditionId) {
                condition = result.variables[conditionId].value
            }

            expect(condition).toBeDefined()

            if (dataSource == null) {
                dataSource = condition.impliedDataSource
            }

            expect(result.intent).toBe(Intent.Highlight)
            expect(dataSource).toEqual(testcase[1])
            expect(condition.type).toEqual(testcase[2].type)
            expect(condition.ref).toEqual(testcase[2].ref)
        })
    }
})