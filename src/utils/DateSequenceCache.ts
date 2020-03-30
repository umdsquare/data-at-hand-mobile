import { DateTimeHelper } from "./time"
import { differenceInDays, addDays, subDays } from "date-fns"
import binarySearch from 'binary-search';

const compareFunc = (element: number, needle: number) => element - needle

export class DateSequenceCache {

    private static _instance: DateSequenceCache | undefined = undefined
    static get instance(): DateSequenceCache {
        if (this._instance == null) {
            this._instance = new DateSequenceCache()
        }
        return this._instance
    }

    static makeSequence(start: number, end: number): Array<number> {
        const startDate = DateTimeHelper.toDate(start)
        const endDate = DateTimeHelper.toDate(end)
        const diff = differenceInDays(endDate, startDate) + 1

        const seq = [start]

        for (let i = 1; i < diff; i++) {
            seq.push(DateTimeHelper.toNumberedDateFromDate(addDays(startDate, i)))
        }
        return seq
    }

    private constructor() { }

    private currentCache: Array<number> = null

    prepare(start: number, end: number) {
        if (this.currentCache == null) {
            this.currentCache = DateSequenceCache.makeSequence(start, end)
        } else {
            const subtracted = DateTimeHelper.subtract([start, end], [this.currentCache[0], this.currentCache[this.currentCache.length - 1]])
            if (subtracted.overlap === true) {
                for(const range of subtracted.rest){
                    const rangeToAttach = DateSequenceCache.makeSequence(
                        range[0],
                        range[1]
                    )

                    if(range[1] < this.currentCache[0]){
                        //left
                        this.currentCache = rangeToAttach.concat(this.currentCache)
                    }else{
                        //right
                        this.currentCache = this.currentCache.concat(rangeToAttach)
                    }
                }
            } else {
                if (end < this.currentCache[0]) {
                    //left
                    const rangeToAttach = DateSequenceCache.makeSequence(
                        start,
                        DateTimeHelper.toNumberedDateFromDate(subDays(DateTimeHelper.toDate(this.currentCache[0]), 1))
                    )
                    this.currentCache = rangeToAttach.concat(this.currentCache)
                    return
                } else {
                    //right
                    const rangeToAttach = DateSequenceCache.makeSequence(
                        DateTimeHelper.toNumberedDateFromDate(addDays(DateTimeHelper.toDate(this.currentCache[0]), 1)),
                        end
                    )
                    this.currentCache = this.currentCache.concat(rangeToAttach)
                    return
                }
            }
        }
    }



    getSequence(start: number, end: number): Array<number> {

        if (this.currentCache == null || (this.currentCache[this.currentCache.length - 1] >= end && this.currentCache[0] <= start) === false) {
            //cannot get from cache
            this.prepare(DateTimeHelper.getYear(start) * 10000 + 101, DateTimeHelper.getYear(end)*10000 + 1231) // cache for one year
        }

        const startIndex = binarySearch(this.currentCache, start, compareFunc)
        const endIndex = binarySearch(this.currentCache, end, compareFunc)
        if (startIndex >= 0 && endIndex >= 0) {
            return this.currentCache.slice(startIndex, endIndex + 1)
        } else throw Error("Cache preparation must be wrong.")
    }

}