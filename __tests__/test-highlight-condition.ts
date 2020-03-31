/**
 * @format
 */

import { preprocess } from '@core/speech/nlp/preprocessor';
import { VariableType, Intent, ConditionInfo } from '@core/speech/nlp/types';
import { subDays } from 'date-fns';
import { DateTimeHelper } from '@utils/time';
import { dataSources, speechOptions } from '../jest.setup';
import { DataSourceType } from '@data-at-hand/core/measure/DataSourceSpec';
import { NumericConditionType } from '@core/exploration/types';

console.log = jest.fn()

const prefixes = [
    "Highlight the days",
    "Count the days",
    "What are the days",
    "Number of days",
    "How many days",
]

const conditions: Array<[string, DataSourceType, ConditionInfo]> = [
    ["I walked more than 1000", DataSourceType.StepCount, { ref: 1000, type: NumericConditionType.More }],
    ["with step count more than 5000", DataSourceType.StepCount, { ref: 5000, type: NumericConditionType.More }],
    ["I was heavier than 150", DataSourceType.Weight, { ref: 150, type: NumericConditionType.More }],
    ["I was lighter than 150", DataSourceType.Weight, { ref: 150, type: NumericConditionType.Less }],
    ["with weight more than 100", DataSourceType.Weight, { ref: 100, type: NumericConditionType.More }],
    ["with weight higher than 100", DataSourceType.Weight, { ref: 100, type: NumericConditionType.More }],
    ["with weight lower than 100", DataSourceType.Weight, { ref: 100, type: NumericConditionType.Less }],
]

describe("Inequation condition", () => {
    for (const prefix of prefixes) {
        describe("Prefix [" + prefix + "]", () => {
            for (const testcase of conditions) {
                it(testcase[0], async ()=> {
                    const result = await preprocess(prefix + " " + testcase[0], speechOptions)

                    const dataSourceId = Object.keys(result.variables).find(k => result.variables[k].type === VariableType.DataSource)
                    const conditionId = Object.keys(result.variables).find(k => result.variables[k].type === VariableType.Condition)
                    
                    let dataSource: DataSourceType
                    let condition: ConditionInfo
                    if(dataSourceId){
                        dataSource = result.variables[dataSourceId].value     
                    }
                    if(conditionId){
                        condition = result.variables[conditionId].value
                    }

                    if(dataSource == null){
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