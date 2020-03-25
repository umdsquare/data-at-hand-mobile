import NamedRegExp from "named-regexp-groups"
import { Parser, ParsedResult } from "chrono-node";
import util from 'chrono-node/src/utils/EN';
import parserApi from "chrono-node/src/parsers/parser";
import { startOfMonth, getYear, isAfter, addYears, endOfMonth } from "date-fns";

const PATTERN = new NamedRegExp(`(?:in\\s*?)?(the\\s+)?(?<prefix>((this|last|past|next)\\s+)+)?(?<month>${util.MONTH_PATTERN})(\\s+(of|in))?(\\s+the)?(?:\\s*(?<suffix>((this|last|past|next)\\s*)+)year)?(\\s+(?<year>[0-9]{4})(\\s+(?<yearBe>BE|AD|BC))?)?`, 'i')
export const makeMonthNameParser = () => {
    const parser = new Parser()
    parser.pattern = () => PATTERN
    parser.extract = (text, ref, match, opt) => {
        const result = new ParsedResult({
            text: match[0],
            index: match.index,
            ref: ref,
        });


        const month = util.MONTH_OFFSET[match.groups.month.toLowerCase()];

        const day = 1;

        let year = null;
        if (match.groups.year) {
            year = match.groups.year;
            year = parseInt(year);

            if (match.groups.yearBe) {
                if (match.groups.yearBe.match(/BE/)) {
                    // Buddhist Era
                    year = year - 543;
                } else if (match.groups.yearBe.match(/BC/)) {
                    // Before Christ
                    year = -year;
                }

            } else if (year < 100) {

                year = year + 2000;
            }
        } if (match.groups.prefix != null || match.groups.suffix != null) {
            let norm = match.groups.prefix || match.groups.suffix;
            norm = norm || '';
            norm = norm.toLowerCase().trim();

            if (norm.length === 0 || norm === 'past') {
                //find recent one
                let pivot = new Date(getYear(ref), month - 1, 1)

                if (norm === 'past') {
                    pivot = endOfMonth(pivot)
                }

                if (isAfter(pivot, ref)) {
                    pivot = addYears(pivot, -1)
                }
                year = getYear(pivot)
            } else if (norm === 'this') {
                year = getYear(ref)
            } else if (norm === 'next') {
            } else {
                const numLast = norm.split(" ").length
                let pivot = endOfMonth(new Date(getYear(ref), month - 1, 1))
                if (isAfter(pivot, ref)) {
                    pivot = addYears(pivot, -1)
                }
                pivot = addYears(pivot, -1 * (numLast - 1))
                year = getYear(pivot)
            }

        }


        if (year) {
            result.start.imply('day', day);
            result.start.assign('month', month);
            result.start.assign('year', year);
        } else {
            year = parserApi.findYearClosestToRef(ref, day, month)
            result.start.imply('day', day);
            result.start.assign('month', month);
            result.start.imply('year', year);
        }

        result.tags['ENMonthNameParser'] = true;
        return result;
    }

    return parser
}
