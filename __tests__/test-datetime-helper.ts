/**
 * @format
 */

import { DateTimeHelper } from '@data-at-hand/core/utils/time';

describe("DateTimeHelper API", () => {
    const fitRangeTestSet: Array<[number, number, Date, string, number]> = [
        [20200202, 20200208, new Date(2020, 1, 2), 'sundayWeek', 0],
        [20200202, 20200208, new Date(2020, 1, 1), 'sundayWeek', -1],
        [20200202, 20200208, new Date(2020, 0, 25), 'sundayWeek', -2],
        [20200202, 20200208, new Date(2020, 1, 9), 'sundayWeek', 1],
        [20200202, 20200208, new Date(2020, 1, 18), 'sundayWeek', 2],
        [20200301, 20200331, new Date(2019, 10, 5), 'month', -4],
        [20200301, 20200331, new Date(2021, 1, 5), 'month', 11],
        [20200101, 20201231, new Date(2019, 5, 2), 'year', -1],
        [20190101, 20191231, new Date(2020, 5, 2), 'year', 1],
    ]

    describe("Semantic Range Test", () => {
        fitRangeTestSet.forEach(testElm => {

            it(`${testElm[0]} - ${testElm[1]}`, () => {
                const result = DateTimeHelper.rangeSemantic(testElm[0], testElm[1], testElm[2])
                expect(result.semantic).toBe(testElm[3])
                expect(result.differenceToRef).toBe(testElm[4])
            })
        })
    })
})