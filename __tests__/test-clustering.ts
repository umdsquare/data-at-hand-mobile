/**
 * @format
 */

import { clusterSortedNumbers } from "@utils/utils"

describe("test 1-D clustering", () => {
    test("case 1", () => {
        const clusters = clusterSortedNumbers([0, 1, 2, 10, 11, 12, 18, 25, 30, 31, 32, 38, 51, 52], 5)
        expect(clusters.length).toEqual(6)
        expect(clusters[0]).toEqual([0, 1, 2])
        expect(clusters[1]).toEqual([10, 11, 12])
        expect(clusters[2]).toEqual([18])
        expect(clusters[3]).toEqual([25, 30, 31, 32])
        expect(clusters[4]).toEqual([38])
        expect(clusters[5]).toEqual([51, 52])
        
    })
})