import { ParsedResult, ComponentName } from "chrono-node";
import { isAfter, addYears, getDate, getMonth, getYear } from "date-fns";
export function getBetweenText(text: string, result1: ParsedResult, result2: ParsedResult): string {
    const begin = result1.index + result1.text.length;
    const end = result2.index;
    return text.substring(begin, end);
}


export function mergeResult(text: string, fromResult: ParsedResult, toResult: ParsedResult): ParsedResult {
    //merge toResult to fromResult.

    if (!fromResult.isOnlyWeekday() && !toResult.isOnlyWeekday()) {

        for (var key in toResult.start.knownValues) {
            if (!fromResult.start.isCertain(key as ComponentName)) {
                fromResult.start.assign(key as ComponentName, toResult.start.get(key as ComponentName));
            }
        }

        for (var key in fromResult.start.knownValues) {
            if (!toResult.start.isCertain(key as ComponentName)) {
                toResult.start.assign(key as ComponentName, fromResult.start.get(key as ComponentName));
            }
        }
    }

    if (fromResult.start.date().getTime() > toResult.start.date().getTime()) {
        //if fromDate is later than toDate

        var fromMoment = fromResult.start.dayjs();
        var toMoment = toResult.start.dayjs();

        if (fromResult.isOnlyWeekday() && fromMoment.add(-7, 'days').isBefore(toMoment)) {
            fromMoment = fromMoment.add(-7, 'days');
            fromResult.start.imply('day', fromMoment.date());
            fromResult.start.imply('month', fromMoment.month() + 1);
            fromResult.start.imply('year', fromMoment.year());
        } else if (toResult.isOnlyWeekday() && toMoment.add(7, 'days').isAfter(fromMoment)) {
            toMoment = toMoment.add(7, 'days');
            toResult.start.imply('day', toMoment.date());
            toResult.start.imply('month', toMoment.month() + 1);
            toResult.start.imply('year', toMoment.year());
        }else if (toResult.start.isCertain('year') === false) {
            //our additional logic
            const fromResultDate = fromResult.start.date()
            let toResultDate = toResult.start.date()
            while (isAfter(fromResultDate, toResultDate)) {
                toResultDate = addYears(toResultDate, 1)
            }

            if (toResult.start.isCertain('day')) {
                toResult.start.assign('day', getDate(toResultDate))
            } else {
                toResult.start.imply('day', getDate(toResultDate))
            }

            if (toResult.start.isCertain('month')) {
                toResult.start.assign('month', getMonth(toResultDate) + 1)
            } else {
                toResult.start.imply('month', getMonth(toResultDate) + 1)
            }

            toResult.start.imply('year', getYear(toResultDate))
        } else {
            var tmp = toResult;
            toResult = fromResult;
            fromResult = tmp;
        }
    }

    fromResult.end = toResult.start;



    for (var tag in toResult.tags) {
        fromResult.tags[tag] = true;
    }


    var startIndex = Math.min(fromResult.index, toResult.index);
    var endIndex = Math.max(
        fromResult.index + fromResult.text.length,
        toResult.index + toResult.text.length);

    fromResult.index = startIndex;
    fromResult.text = text.substring(startIndex, endIndex);
    return fromResult;
}