/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../App';

// Note: test renderer must be required after react-native.
import { preprocess } from '@core/speech/nlp/preprocessor';
import { NLUOptions, VariableType } from '@core/speech/nlp/types';
import { MeasureUnitType, DataSourceType } from '@measure/DataSourceSpec';
import { subDays } from 'date-fns';
import { DateTimeHelper } from '@utils/time';

console.log = jest.fn()

/*it('renders correctly', () => {
  renderer.create(<App />);
});*/

const speechOptions = {
  getToday: () => new Date(2020, 2, 1), // today is 2020 3/1
  measureUnit: MeasureUnitType.Metric
} as NLUOptions

const dayOfWeeks: Array<[string, number]> = [
  ['sunday', 20200301],
  ['monday', 20200224],
  ['tuesday', 20200225],
  ['wednesday', 20200226],
  ['thursday', 20200227],
  ['friday', 20200228],
  ['saturday', 20200229]
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

const relatives: Array<[string, [number, number]]> = [
  ["this month", [20200301, 20200331]],
  ["last month", [20200201, 20200229]],
  ["last last month", [20200101, 20200131]],
  ["this week", [20200224, 20200301]],
  ["last week", [20200217, 20200223]],
  ["last last week", [20200210, 20200216]],
]

const months: Array<[string, [number, number]]> = [
  ["january", [20200101, 20200131]],
  ["february", [20200201, 20200229]],
  ["march", [20200301, 20200331]],
  ["april", [20190401, 20190430]],
  ["may", [20190501, 20190531]],
  ["june", [20190601, 20190630]],
  ["july", [20190701, 20190731]],
  ["august", [20190801, 20190831]],
  ["september", [20190901, 20190930]],
  ["october", [20191001, 20191031]],
  ["november", [20191101, 20191130]],
  ["december", [20191201, 20191231]],
  ["last january", [20200101, 20200131]],
  ["past january", [20200101, 20200131]],
  ["last march", [20190301, 20190331]],
  ["january 2018", [20180101, 20180131]]
]

const seasons: Array<[string, [number, number]]> = [
  ["spring", [20200301, 20200531]],
  ["summer", [20190601, 20190831]],
  ["autumn", [20190901, 20191130]],
  ["fall", [20190901, 20191130]],
  ["winter", [20191201, 20200229]],
  ["last spring", [20190301, 20190531]],
  ["last summer", [20190601, 20190831]],
  ["last autumn", [20190901, 20191130]],
  ["last fall", [20190901, 20191130]],
  ["last winter", [20191201, 20200229]],
  ["spring 2017", [20170301, 20170531]],
  ["summer 2017", [20170601, 20170831]],
  ["autumn 2017", [20170901, 20171130]],
  ["fall 2017", [20170901, 20171130]],
  ["winter 2017", [20171201, 20180228]],
  ["spring of 2017", [20170301, 20170531]],
  ["summer of 2017", [20170601, 20170831]],
  ["autumn of 2017", [20170901, 20171130]],
  ["fall of 2017", [20170901, 20171130]],
  ["winter of 2017", [20171201, 20180228]],
]

const manualPeriods: Array<[string, [number, number]]> = [
  ["from February 1 to March 10", [20200201, 20200310]],
  ["from October 10 to January 20", [20191010, 20200120]],
  ["from February to April", [20200201, 20200430]],
  ["from November to March", [20191101, 20200331]],
  
]

const dayExpressions = dayOfWeeks.concat(dayOfWeeksLast).concat(dayOfWeeksLastLast).concat(specificDays)
const periodExpressions = relatives.concat(months).concat(seasons).concat(manualPeriods)

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


describe("Periods", () => {
  periodExpressions.forEach(r => {
    it(r[0], async () => {
      const result = await preprocess(r[0], speechOptions)
      expect(Object.keys(result.variables).length).toEqual(1)
      const id = Object.keys(result.variables)[0]
      expect(result.variables[id].type).toBe(VariableType.Period)
      expect(result.variables[id].value[0]).toEqual(r[1][0])
      expect(result.variables[id].value[1]).toEqual(r[1][1])
    });
  })
})

const dataSources = [
  ["step count", DataSourceType.StepCount],
  ["steps", DataSourceType.StepCount],
  ["weight", DataSourceType.Weight],
  ["heart rate", DataSourceType.HeartRate],
  ["sleep range", DataSourceType.SleepRange],
  ["sleep schedule", DataSourceType.SleepRange],
  ["hours slept", DataSourceType.HoursSlept],
  ["sleep length", DataSourceType.HoursSlept],
]

describe("[DataSource] on [Date]", () => {
  for (const dayExpression of dayExpressions) {
    for (const dataSource of dataSources) {
      const sentence = `${dataSource[0]} on ${dayExpression[0]}`
      it(sentence, async () => {
        const result = await preprocess(sentence, speechOptions)
        const dataSourceId = Object.keys(result.variables)[0]
        const dateId = Object.keys(result.variables)[1]

        expect(result.variables[dataSourceId].type).toBe(VariableType.DataSource)
        expect(result.variables[dataSourceId].value).toEqual(dataSource[1])
        expect(result.variables[dateId].type).toBe(VariableType.Date)
        expect(result.variables[dateId].value).toEqual(dayExpression[1])
      })
    }
  }
})

describe("[DataSource] of/in/during [Period]", () => {
  for (const preposition of ["of", "in", "during"]) {
    for (const periodExpression of periodExpressions) {
      for (const dataSource of dataSources) {
        const sentence = `${dataSource[0]} ${preposition} ${periodExpression[0]}`
        it(sentence, async () => {
          const result = await preprocess(sentence, speechOptions)
          const dataSourceId = Object.keys(result.variables)[0]
          const rangeId = Object.keys(result.variables)[1]

          expect(result.variables[dataSourceId].type).toBe(VariableType.DataSource)
          expect(result.variables[dataSourceId].value).toEqual(dataSource[1])
          expect(result.variables[rangeId].type).toBe(VariableType.Period)
          expect(result.variables[rangeId].value[0]).toEqual(periodExpression[1][0])
          expect(result.variables[rangeId].value[1]).toEqual(periodExpression[1][1])
        })
      }
    }
  }
})
