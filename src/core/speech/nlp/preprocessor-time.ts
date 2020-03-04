import { VariableType } from "./types";
import { DateTimeHelper } from "../../../time";
import { startOfMonth, startOfYear, endOfMonth, endOfYear } from "date-fns";

export function parseTimeText(text: string): { type: VariableType.Date | VariableType.Period, value: number | [number, number] } {
    var chrono = require('chrono-node');
    const chronoResult: chrono.ParsedResult[] = chrono.parse(text)
    if(chronoResult.length > 0){
        const bestResult = chronoResult[0]
        if(bestResult.end){
            //period
            let startDate: Date|undefined
            if(bestResult.start.isCertain('day')){
                startDate = bestResult.start.date()
            }else if (bestResult.start.isCertain('month')){
                startDate = startOfMonth(bestResult.start.date())
            }else if(bestResult.start.isCertain('year')){
                startDate = startOfYear(bestResult.start.date())
            }

            let endDate: Date|undefined
            if(bestResult.end.isCertain('day')){
                endDate = bestResult.end.date()
            }else if(bestResult.end.isCertain('month')){
                endDate = endOfMonth(bestResult.end.date())
            }else if(bestResult.end.isCertain('year')){
                endDate = endOfYear(bestResult.end.date())
            }

            if(startDate != null && endDate != null){
                return {
                    type: VariableType.Period,
                    value: [DateTimeHelper.toNumberedDateFromDate(startDate), DateTimeHelper.toNumberedDateFromDate(endDate)]
                }
            }else return null

        }else{
            //date
            return {
                type: VariableType.Date,
                value: DateTimeHelper.toNumberedDateFromDate(bestResult.start.date())
            }
        }
    }
    return null
}

export function parseDateTextToNumberedDate(text: string): number {
    var chrono = require('chrono-node');
    const chronoResult: chrono.ParsedResult[] = chrono.parse(text)
    if(chronoResult.length > 0){
        const bestResult = chronoResult[0]
        if(bestResult.start.isCertain('day')){
            const date = bestResult.start.date()
            return DateTimeHelper.toNumberedDateFromDate(date)
        }else return null
    }
    return null
}