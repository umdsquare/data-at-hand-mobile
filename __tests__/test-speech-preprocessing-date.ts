/**
 * @format
 */

import { preprocess } from '@core/speech/nlp/preprocessor';
import { subDays } from 'date-fns';
import { DateTimeHelper } from '@data-at-hand/core/utils/time';
import { dataSources, speechOptions } from '../jest.setup';
import { VariableType } from '@data-at-hand/core';

console.log = jest.fn()

const specificDays: Array<[string, number]> = [
    ["january 1", 20200101],
    ["january 15", 20200115],
    ["february 1", 20200201],
    ["march 5", 20190305],
    ["may 1", 20190501],
    ["june 1", 20190601],
    ["july 1", 20190701],
    ["august 1", 20190801],
    ["september 1", 20190901],
    ["october 1", 20191001],
    ["november 1", 20191101],
    ["december 1", 20191201],
]


const dayOfWeeks: Array<[string, number]> = [
    ['sunday', 20200301],
    ['monday', 20200224],
    ['tuesday', 20200225],
    ['wednesday', 20200226],
    ['thursday', 20200227],
    ['friday', 20200228],
    ['saturday', 20200229],
]


const holidays: Array<[string, number]> = [
    ["New Year's Day", 20200101],
    ["Valentine Day", 20200214],
    ["Martin Luther King Junior Day", 20200120],
    ["Presidents Day", 20200217],
    ["Easter", 20190421],
    ["Columbus Day", 20191014],
    ["Mother's Day", 20190512],
    ["Memorial Day", 20190527],
    ["Father's Day", 20190616],
    ["Independence Day", 20190704],
    ["Labor Day", 20190902],
    ["Halloween", 20191031],
    ["Veterans Day", 20191111],
    ["Thanksgiving Day", 20191128],
    ["Christmas", 20191225]
]

const dayOfWeeksLast: Array<[string, number]> = dayOfWeeks.map(e =>
    [
        "last " + e[0],
        DateTimeHelper.toNumberedDateFromDate(subDays(DateTimeHelper.toDate(e[1]), 7))
    ]
)

const dayOfWeeksLastLast: Array<[string, number]> = dayOfWeeks.map(e =>
    [
        "last last " + e[0],
        DateTimeHelper.toNumberedDateFromDate(subDays(DateTimeHelper.toDate(e[1]), 14))
    ]
)

const dayExpressions = dayOfWeeks.concat(dayOfWeeksLast).concat(dayOfWeeksLastLast).concat(specificDays).concat(holidays)



describe("Day-only sentence", () => {
    dayExpressions.forEach(d => {
        it(d[0], async () => {
            const result = await preprocess(d[0], speechOptions)
            expect(Object.keys(result.variables).length).toEqual(1)
            const id = Object.keys(result.variables)[0]
            expect(result.variables[id].type).toBe(VariableType.Date)
            expect(result.variables[id].value).toEqual(d[1])
        });
    })
})



describe("[DataSource] on [Date]", () => {
    for (const dayExpression of dayExpressions) {
        for (const dataSource of dataSources) {
            const sentence = `${dataSource[0]} on ${dayExpression[0]}`
            it(sentence, async () => {
                const result = await preprocess(sentence, speechOptions)
                const dataSourceId = Object.keys(result.variables).find(k => result.variables[k].type === VariableType.DataSource)
                const dateId = Object.keys(result.variables).find(k => result.variables[k].type === VariableType.Date)

                expect(Object.keys(result.variables).length).toBe(2)
                expect(result.variables[dataSourceId].type).toBe(VariableType.DataSource)
                expect(result.variables[dataSourceId].value).toEqual(dataSource[1])
                expect(result.variables[dateId].type).toBe(VariableType.Date)
                expect(result.variables[dateId].value).toEqual(dayExpression[1])
            })
        }
    }
})