import { getYear, getMonth, getDate, differenceInDays, subDays, addDays, isSameMonth, isFirstDayOfMonth, isLastDayOfMonth, addMonths, lastDayOfMonth, isSameYear, startOfMonth, endOfMonth, format, isSameDay } from "date-fns"
import { toDate } from "date-fns-tz"

/**
 * 
 *   YYYYMMDD 
 */

export class DateTimeHelper {
    static toDate(numberedDate: number, timeZone?: string): Date {
        return toDate(this.toFormattedString(numberedDate), { timeZone: timeZone })
    }

    static toNumberedDateFromValues(year: number, month: number, day: number): number {
        return year * 10000 + month * 100 + day
    }

    static toNumberedDateFromDate(date: Date): number {
        return this.toNumberedDateFromValues(getYear(date), getMonth(date) + 1, getDate(date))
    }

    static getYear(numberedDate: number): number {
        return Math.floor(numberedDate / 10000)
    }

    static getMonth(numberedDate: number): number {
        return Math.floor((numberedDate % 10000) / 100)
    }

    static getDayOfMonth(numberedDate: number): number {
        return numberedDate % 100
    }

    static toFormattedString(numberedDate: number): string {
        if(numberedDate){
            return pad(this.getYear(numberedDate), 4) + "-" + pad(this.getMonth(numberedDate), 2) + "-" + pad(this.getDayOfMonth(numberedDate), 2)
        }else return null
    }

    static fromFormattedString(str: string): number {
        const split = str.split('-')
        return this.toNumberedDateFromValues(Number.parseInt(split[0]), Number.parseInt(split[1]), Number.parseInt(split[2]))
    }

    static splitRange(start: number, end: number, maxNumDays: number): Array<[number, number]> {

        const startDate = this.toDate(start)
        const endDate = this.toDate(end)
        const wholeDiff = differenceInDays(endDate, startDate) + 1
        if (wholeDiff <= maxNumDays) {
            return [[start, end]]
        } else {
            var chunks = []
            var pointer: Date = endDate
            var leftDays = wholeDiff
            while (leftDays >= maxNumDays) {

                const newStart = subDays(pointer, maxNumDays - 1)
                chunks.push([this.toNumberedDateFromDate(newStart), this.toNumberedDateFromDate(pointer)])
                pointer = subDays(newStart, 1)
                leftDays -= maxNumDays
            }

            if (leftDays > 0) {
                chunks.push([this.toNumberedDateFromDate(subDays(pointer, leftDays - 1)), this.toNumberedDateFromDate(pointer)])
            }

            return chunks
        }
    }

    static rangeToSequence(start: number, end: number): Array<number> {
        const startDate = this.toDate(start)
        const endDate = this.toDate(end)
        const diff = differenceInDays(endDate, startDate) + 1

        const seq = [start]

        for (let i = 1; i < diff; i++) {
            seq.push(this.toNumberedDateFromDate(addDays(startDate, i)))
        }

        return seq
    }

    static formatDuration(durationInSeconds: number, roundToMins: boolean = false): string {
        var usedDuration = durationInSeconds
        if (usedDuration === 0) {
            return "0"
        }

        if (roundToMins === true) {
            if (durationInSeconds % 60 >= 30)
                usedDuration = durationInSeconds - (durationInSeconds % 60) + 60
            else usedDuration = durationInSeconds - (durationInSeconds % 60)
        }

        const hours = Math.floor(usedDuration / 3600)
        const minutes = Math.floor((usedDuration % 3600) / 60)
        const seconds = usedDuration % 60
        return ((hours > 0 ? (hours + "h ") : "") + (minutes > 0 ? (minutes + "m ") : "") + (seconds > 0 ? (seconds + "s ") : "")).trim()
    }

    static formatDurationParsed(durationInSeconds: number, roundToMins: boolean = false): Array<{ type: "unit" | "digit", text: string }> {
        var usedDuration = durationInSeconds
        if (usedDuration === 0) {
            return [{ type: "digit", text: "0" }, { type: "digit", text: " mins" }]
        }

        if (roundToMins === true) {
            if (durationInSeconds % 60 >= 30)
                usedDuration = durationInSeconds - (durationInSeconds % 60) + 60
            else usedDuration = durationInSeconds - (durationInSeconds % 60)
        }

        const hours = Math.floor(usedDuration / 3600)
        const minutes = Math.floor((usedDuration % 3600) / 60)
        const seconds = usedDuration % 60

        const result = []
        if (hours > 0) {
            result.push({ type: 'digit', text: hours })
            result.push({ type: 'unit', text: "hr" })
        }

        if (minutes > 0) {
            result.push({ type: "digit", text: minutes })
            result.push({ type: "unit", text: "min" })
        }

        if (seconds > 0) {
            result.push({ type: "digit", text: seconds })
            result.push({ type: "unit", text: "sec" })
        }

        return result
    }

    static pageRange(range: [number, number], direction: -1 | 1): [number, number] {
        const startDate = DateTimeHelper.toDate(range[0])
        const endDate = DateTimeHelper.toDate(range[1])
        if (isSameMonth(startDate, endDate) === true && isFirstDayOfMonth(startDate) === true && isLastDayOfMonth(endDate) === true) {
            const newStartDate = addMonths(startDate, direction)
            //month
            return [DateTimeHelper.toNumberedDateFromDate(newStartDate), DateTimeHelper.toNumberedDateFromDate(lastDayOfMonth(newStartDate))]
        } else {
            const numDays = differenceInDays(endDate, startDate) + 1
            return [DateTimeHelper.toNumberedDateFromDate(addDays(startDate, direction * numDays)),
            DateTimeHelper.toNumberedDateFromDate(addDays(endDate, direction * numDays))]
        }
    }

    static formatRange(range: [number, number], singleLine: boolean = false): string[] {
        const startDate = DateTimeHelper.toDate(range[0])
        const endDate = DateTimeHelper.toDate(range[1])

        if (isSameYear(startDate, endDate) && DateTimeHelper.getMonth(range[0]) === 1 && DateTimeHelper.getDayOfMonth(range[0]) === 1 && DateTimeHelper.getMonth(range[1]) === 12 && DateTimeHelper.getDayOfMonth(range[1]) === 31) {
            //yaer
            return [DateTimeHelper.getYear(range[0]).toString()]
        } else if (isSameMonth(startDate, endDate) && DateTimeHelper.toNumberedDateFromDate(startOfMonth(startDate)) === range[0] && DateTimeHelper.toNumberedDateFromDate(endOfMonth(endDate)) === range[1]) {
            return [format(startDate, "MMMM yyyy")]
        } else if (isSameYear(startDate, endDate) === true) {
            if (isSameMonth(startDate, endDate) === true){
                return singleLine === true ? [`${format(startDate, "MMM dd")} - ${format(endDate, "dd")}, ${format(endDate, "yyyy")}`]
                : [`${format(startDate, "MMM dd")} - ${format(endDate, "dd")}`, format(endDate, "yyyy")]
            } else return singleLine === true ? [`${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd")}, ${format(endDate, "yyyy")}`]
                : [`${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd")}`, format(endDate, "yyyy")]
        } else return singleLine === true ? [`${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`]
            : [format(startDate, "MMM dd, yyyy -"), format(endDate, "MMM dd, yyyy")]
    }
}


export function pad(n, len) {

    var s = n.toString();
    if (s.length < len) {
        s = ('0000' + s).slice(-len);
    }

    return s;

}

export function isToday(date: Date, today: Date = new Date()): boolean{
    return isSameDay(date, today)
}

export function isYesterday(date: Date, today: Date = new Date()): boolean{
    return differenceInDays(today, date) === 1
}