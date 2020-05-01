import { Refiner, ParsedResult, ComponentName } from "chrono-node";
import { isAfter, addYears, getDate, getMonth, getYear } from "date-fns";
import { getBetweenText } from "../chrono-utils";

export const makeENMergeDateRangeRefiner = () => {

    const refiner = new Refiner()

    refiner.pattern = function () { return /^[,.]?\s*(to|through|two|\-|2)\s*$/i };

    refiner.refine = function (text, results, opt) {

        if (results.length < 2) return results;

        var mergedResult = [];
        var currResult = null;
        var prevResult = null;

        for (var i = 1; i < results.length; i++) {

            currResult = results[i];
            prevResult = results[i - 1];

            if (!prevResult.end && !currResult.end) {
                let merge: boolean = false
                if (refiner.pattern().test(getBetweenText(text, prevResult, currResult)) === true) {
                    merge = true
                } else if (isTwoSuspiciousTobeTo(text, prevResult, currResult) === true) {
                    //infer what finishes with two
                    const yearEndsWith2 = isEndingWith2("year", prevResult)
                    const dayEndsWith2 = isEndingWith2("day", prevResult)

                    if (yearEndsWith2 === true || dayEndsWith2 === true) {
                        if (yearEndsWith2 === true && dayEndsWith2 === true) {
                            //TODO throughly check which one was spoken lastly
                            if (prevResult.start.knownValues.year > getYear(prevResult.ref)) {
                                prevResult.start.assign("year", prevResult.start.knownValues.year - 2)
                            } else {
                                prevResult.start.assign("day", prevResult.start.knownValues.day - 2)
                            }

                        } else if (yearEndsWith2 === true) {
                            //year
                            prevResult.start.assign("year", prevResult.start.knownValues.year - 2)
                        } else {
                            //date
                            prevResult.start.assign("day", prevResult.start.knownValues.day - 2)
                        }
                        merge = true
                    }
                }

                if (merge === true) {
                    prevResult = mergeResult(text, prevResult, currResult);
                    currResult = null;
                    i += 1;
                }
            }

            mergedResult.push(prevResult);
        }


        if (currResult != null) {
            mergedResult.push(currResult);
        }



        return mergedResult;
    };

    function isEndingWith2(valueName: string, result: ParsedResult): boolean {
        return result.start.knownValues[valueName] != null && (result.start.knownValues[valueName] % 10) === 2 && result.start.knownValues[valueName] > 20
    }

    function isTwoSuspiciousTobeTo(text: string, result1: ParsedResult, result2: ParsedResult) {
        return /^[,.]?\s*$/i.test(getBetweenText(text, result1, result2)) === true && /(2nd)|2$/i.test(result1.text) === true
    }

    function mergeResult(text: string, fromResult: ParsedResult, toResult: ParsedResult) {

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
            } else if (toResult.start.isCertain('year') === false) {
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
        fromResult.tags["ENMergeDateRangeRefiner"] = true;
        return fromResult;
    }

    return refiner
}