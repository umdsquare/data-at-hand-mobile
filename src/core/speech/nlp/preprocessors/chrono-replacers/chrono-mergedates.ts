import { Refiner, ParsedResult, ComponentName } from "chrono-node";
import { isAfter, addYears, getDate, getMonth, getYear } from "date-fns";
import { getBetweenText, mergeResult } from "../chrono-utils";

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
                    prevResult.tags["ENMergeDateRangeRefiner"] = true;
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


    return refiner
}