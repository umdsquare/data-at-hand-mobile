import { getYear, getMonth, getDate, differenceInDays, subDays } from "date-fns"
import { toDate } from "date-fns-tz"

/**
 * 
 *   YYYYMMDD 
 */

export class DateTimeHelper{
    static toDate(numberedDate: number, timeZone?: string): Date{
        return toDate(this.toFormattedString(numberedDate), {timeZone: timeZone})
    }

    static toNumberedDateFromValues(year: number, month: number, day: number): number{
        return year * 10000 + month * 100 + day
    }

    static toNumberedDateFromDate(date: Date): number{
        return this.toNumberedDateFromValues(getYear(date), getMonth(date)+1, getDate(date))
    }

    static getYear(numberedDate: number): number{
        return Math.floor(numberedDate / 10000)
    }

    static getMonth(numberedDate: number): number{
        return Math.floor((numberedDate%10000)/100)
    }

    static getDayOfMonth(numberedDate: number): number{
        return numberedDate%100
    }

    static toFormattedString(numberedDate: number): string{
        return pad(this.getYear(numberedDate), 4) + "-" + pad(this.getMonth(numberedDate), 2) + "-" + pad(this.getDayOfMonth(numberedDate), 2)
    }

    static fromFormattedString(str: string): number{
        const split = str.split('-')
        return this.toNumberedDateFromValues(Number.parseInt(split[0]), Number.parseInt(split[1]), Number.parseInt(split[2]))
    }

    static splitRange(start: number, end: number, maxNumDays: number): Array<[number, number]>{
        
        const startDate = this.toDate(start)
        const endDate = this.toDate(end)
        const wholeDiff = differenceInDays(endDate, startDate) + 1
        if(wholeDiff <= maxNumDays){
            return [[start, end]]
        }else{
            var chunks = []
            var pointer: Date = endDate
            var leftDays = wholeDiff
            while(leftDays >= maxNumDays){

                const newStart = subDays(pointer, maxNumDays-1)
                chunks.push([this.toNumberedDateFromDate(newStart), this.toNumberedDateFromDate(pointer)])
                pointer = subDays(newStart, 1)
                leftDays -= maxNumDays
            }

            if(leftDays > 0){
                chunks.push([this.toNumberedDateFromDate(subDays(pointer, leftDays-1)), this.toNumberedDateFromDate(pointer)])
            }

            return chunks
        }
    }
}


function pad(n, len) {
   
    var s = n.toString();
    if (s.length < len) {
        s = ('0000' + s).slice(-len);
    }
  
    return s;
   
  }