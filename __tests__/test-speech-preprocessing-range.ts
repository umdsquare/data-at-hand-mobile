/**
 * @format
 */

import { preprocess } from '@core/speech/nlp/preprocessor';
import { dataSources, speechOptions, TODAY, DATA_INITIAL_DATE } from '../jest.setup';
import { VariableType, Intent } from '@data-at-hand/core';

/*it('renders correctly', () => {
  renderer.create(<App />);
});*/

const relatives: Array<[string, [number, number]]> = [
  ["this month", [20200301, 20200331]],
  ["last month", [20200201, 20200229]],
  ["last last month", [20200101, 20200131]],
  ["this week", [20200224, 20200301]],
  ["last week", [20200217, 20200223]],
  ["last last week", [20200210, 20200216]],
  ["this year", [20200101, 20201231]],
  ["last year", [20190101, 20191231]],
  ["2019", [20190101, 20191231]],
  ["2020", [20200101, 20201231]],
  ["year 2020", [20200101, 20201231]],
  ["recent 10 days", [20200221, 20200301]],
  ["resent 10 days", [20200221, 20200301]],
  ["past 10 days", [20200221, 20200301]],
  ["last 10 days", [20200221, 20200301]],
  ["last seven days", [20200224, 20200301]]
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
  ["last february", [20200201, 20200229]],
  ["last march", [20190301, 20190331]],
  ["last april", [20190401, 20190430]],
  ["last may", [20190501, 20190531]],
  ["last june", [20190601, 20190630]],
  ["last july", [20190701, 20190731]],
  ["last august", [20190801, 20190831]],
  ["last september", [20190901, 20190930]],
  ["last october", [20191001, 20191031]],
  ["last november", [20191101, 20191130]],
  ["last december", [20191201, 20191231]],
  ["past january", [20200101, 20200131]],
  ["january 2018", [20180101, 20180131]],
  ["january 20:19", [20190101, 20190131]],
  ["january of the last year", [20190101, 20190131]],
  ["january of this year", [20200101, 20200131]],
  ["january of last year", [20190101, 20190131]],
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

const since: Array<[string, [number, number]]> = [...months, ...seasons].map(entry => {
  return [`since ${entry[0]}`, [entry[1][0], TODAY]]
})

const manualPeriods: Array<[string, [number, number]]> = [
  ["from February 1 to March 10", [20200201, 20200310]],
  ["from February 1 through March 10", [20200201, 20200310]],
  ["from February 1 two March 10", [20200201, 20200310]],
  //["from March 1 to 31", [20200301, 20200331]],
  ["from October 10 to January 20", [20191010, 20200120]],
  ["from October 10 two January 20", [20191010, 20200120]],
  ["from October 10 through January 20", [20191010, 20200120]],
  ["from February to April", [20200201, 20200430]],
  ["from November to March", [20191101, 20200331]],
  ["from Sunday to Thursday", [20200223, 20200227]],
  ["from Thursday to Tuesday", [20200220, 20200225]],
  ["from Monday to Wednesday", [20200224, 20200226]],
  ["from last Monday to this Wednesday", [20200217, 20200226]],
  ["from 2019 to 2020", [20190101, 20201231]],
  ["the entire period", [DATA_INITIAL_DATE, TODAY]]

]

const dictationErrorPeriods: Array<[string, [number, number]]> = [
  ["the range of January 20th 2 February 10th", [20200120, 20200210]],
  ["the range of January 2 2 February 10th", [20200102, 20200210]],
  ["Date for december 12th, two december 16th", [20191212, 20191216]],
  ["from January 2022. February 2020", [20200101, 20200229]],
  ["from February 22, February 28", [20200220, 20200228]],
]

const periodExpressions = relatives.concat(months).concat(seasons).concat(manualPeriods).concat(dictationErrorPeriods).concat(since)

describe("Normal Periods", () => {
  relatives.concat(months).concat(seasons).concat(manualPeriods).forEach(r => {
    it(r[0], async () => {
      const result = await preprocess(r[0], speechOptions)
      expect(Object.keys(result.variables).length).toBeGreaterThanOrEqual(1)
      const id = Object.keys(result.variables)[0]
      expect(result.variables[id].type).toBe(VariableType.Period)
      expect(result.variables[id].value[0]).toEqual(r[1][0])
      expect(result.variables[id].value[1]).toEqual(r[1][1])
    });
  })
})


describe("Dictation Error Periods", () => {
  dictationErrorPeriods.forEach(r => {
    it(r[0], async () => {
      const result = await preprocess(r[0], speechOptions)
      expect(Object.keys(result.variables).length).toBeGreaterThanOrEqual(1)
      const id = Object.keys(result.variables)[0]
      expect(result.variables[id].type).toBe(VariableType.Period)
      expect(result.variables[id].value[0]).toEqual(r[1][0])
      expect(result.variables[id].value[1]).toEqual(r[1][1])
    });
  })
})

describe("[DataSource] of/in/during [Period]", () => {
  for (const preposition of ["of", "in", "during"]) {
    for (const periodExpression of periodExpressions) {
      for (const dataSource of dataSources) {
        const sentence = `${dataSource[0]} ${preposition} ${periodExpression[0]}`
        it(sentence, async () => {
          const result = await preprocess(sentence, speechOptions)

          let dataSourceId: string
          let rangeId: string

          Object.keys(result.variables).forEach(id => {
            if (result.variables[id].type === VariableType.DataSource) {
              dataSourceId = id
            } else if (result.variables[id].type === VariableType.Period) {
              rangeId = id
            }
          })

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


const comparisonConjunction = ["with", /*"to"*/, "and"]
const comparisonDataSourcePreposition = [" of",/* " in", " on", " at",*/ ""]

const comparisonFormat = [
  "compare {rangeA} {conjunction} {rangeB}",
  "compare {dataSource}{dataSourcePreposition} {rangeA} {conjunction} {rangeB}",
  "compare {rangeA} {conjunction} {rangeB}{dataSourcePreposition} {dataSource}"
]

const ranges = [...manualPeriods, ...months.filter(m => /20:19/i.test(m[0]) === false)]

describe("Comparison between ranges", () => {
  ranges.forEach((rA, iA) => {
    ranges.forEach((rB, iB) => {
      if (iA !== iB && iA > iB) {

        comparisonConjunction.forEach((c, iC) => {
          comparisonFormat.forEach(format => {
            if (format.includes("{dataSource}") === true) {
              dataSources.forEach(([dataSourceText, dataSourceValue]) => {
                comparisonDataSourcePreposition.forEach(dataSourcePreposition => {
                  const sentence = format
                    .replace("{rangeA}", rA[0])
                    .replace("{rangeB}", rB[0])
                    .replace("{conjunction}", c)
                    .replace("{dataSource}", dataSourceText)
                    .replace("{dataSourcePreposition}", dataSourcePreposition)

                  it(sentence, async () => {
                    const result = await preprocess(sentence, speechOptions)

                    expect(result.intent).toEqual(Intent.Compare)

                    const rangeVariables = Object.keys(result.variables).filter(k => result.variables[k].type === VariableType.Period).map(id => result.variables[id])
                    expect(rangeVariables.length).toEqual(2)

                    const parsedRangeA = rangeVariables.find(v => v.value[0] === rA[1][0] && v.value[1] === rA[1][1])
                    const parsedRangeB = rangeVariables.find(v => v.value[0] === rB[1][0] && v.value[1] === rB[1][1])

                    expect(parsedRangeA.value).toEqual(rA[1])
                    expect(parsedRangeB.value).toEqual(rB[1])

                    const dataSourceId = Object.keys(result.variables).find(k => result.variables[k].type === VariableType.DataSource)
                    expect(result.variables[dataSourceId].type).toBe(VariableType.DataSource)
                    expect(result.variables[dataSourceId].value).toEqual(dataSourceValue)

                  })
                })

              })
            } else {
              //format without data source

              const sentence = format
                .replace("{rangeA}", rA[0])
                .replace("{rangeB}", rB[0])
                .replace("{conjunction}", c)

              it(sentence, async () => {
                const result = await preprocess(sentence, speechOptions)

                expect(result.intent).toEqual(Intent.Compare)

                const rangeVariables = Object.keys(result.variables).filter(k => result.variables[k].type === VariableType.Period).map(id => result.variables[id])
                expect(rangeVariables.length).toEqual(2)

                const parsedRangeA = rangeVariables.find(v => v.value[0] === rA[1][0] && v.value[1] === rA[1][1])
                const parsedRangeB = rangeVariables.find(v => v.value[0] === rB[1][0] && v.value[1] === rB[1][1])

                expect(parsedRangeA.value).toEqual(rA[1])
                expect(parsedRangeB.value).toEqual(rB[1])
              })
            }
          })
        })
        /*
        comparisonPrefixes.forEach((p, iP) => {
          comparisonConjunction.forEach((c, iC) => {

            const sentence = `${p} ${rA[0]} ${c} ${rB[0]}`

            it(sentence, async ()=>{
              const result = await preprocess(sentence, speechOptions)
              
              expect(result.intent).toEqual(Intent.Compare)
              
              const rangeVariables = Object.keys(result.variables).filter(k => result.variables[k].type === VariableType.Period).map(id => result.variables[id])
              expect(rangeVariables.length).toEqual(2)

              const parsedRangeA = rangeVariables.find(v => v.value[0] === rA[1][0] && v.value[1] === rA[1][1])
              const parsedRangeB = rangeVariables.find(v => v.value[0] === rB[1][0] && v.value[1] === rB[1][1])
              
              expect(parsedRangeA.value).toEqual(rA[1])
              expect(parsedRangeB.value).toEqual(rB[1])
            })
          })
        })*/
      }
    })
  })
})