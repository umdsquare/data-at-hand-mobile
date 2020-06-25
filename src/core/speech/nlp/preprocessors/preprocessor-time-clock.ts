import NamedRegExp from 'named-regexp-groups'
import { BEDTIME_SHIFT_HOUR_OF_DAY } from '@measure/consts'

const PLACEHOLDER_CLOCKTIME = "CLOCK_TIME"

const SECONDS_HOUR = 3600
const SECONDS_DAY = 24 * SECONDS_HOUR

//define template using h, m, and a
const clockTimeRules: Array<{
    regex: RegExp | RegExp[],
    parser: (obj: any, preferred: "day" | "night") => { h: number, m: number } | null
}> = [
        {
            //noon / midnight
            regex: [new NamedRegExp("(^|\\s+)(?<noon>noon)|(?<midnight>midnight)($|\\s+)", "i")],
            parser: (obj: { noon?: string, midnight?: string }, preferred) => {
                if (obj.noon) {
                    return { h: 12, m: 0 }
                } else if (obj.midnight) {
                    return preferred === 'day' ? { h: 24, m: 0 } : { h: 0, m: 0 }
                } else return null
            }
        },
        {
            //normal expression
            regex: [
                new NamedRegExp("(^|\\s+)(?<h>[0-9]+)(:(?<m>[0-9]+))?(\\s+o'clock)?(\\s+(?<a>am|pm))?($|\\s+)", "i"),
                new NamedRegExp("(^|\\s+)(?<h>[0-9]+)\\s+(?<m>[0-9]+)($|\\s+)", "i"),
            ],
            parser: (obj: { h: string, m?: string, a?: string }, preferred) => {

                let h: number
                let m: number
                let amPm: "am" | "pm"

                if (obj.m == null && obj.a == null) {
                    //number-only. consider cases such as 730 (seven thirty)
                    m = 0

                    const number = Number.parseInt(obj.h)
                    if (number <= 12) {
                        h = number
                    } else {
                        if (obj.h.length <= 3) {
                            h = Number.parseInt(obj.h.charAt(0))
                            m = Number.parseInt(obj.h.substring(1, obj.h.length))
                        } else {
                            h = Number.parseInt(obj.h.substr(0, 2))
                            m = Number.parseInt(obj.h.substring(2, Math.min(2, obj.h.length)))
                        }
                    }

                } else {

                    h = Number.parseInt(obj.h)
                    m = obj.m ? Number.parseInt(obj.m) : 0

                    if (h > 12) {
                        return { h, m: 0 }
                    } else {
                        if (obj.a) {
                            amPm = obj.a as any
                        }
                    }
                }

                if (amPm == null) {

                    //infer am pm
                    //infer it
                    //day(waketime)
                    /*
                    1 -> 1pm (same day)
                    2 -> 2pm (same day)
                    3 -> 3pm (same day)
                    4 -> 4am (same day)
                    5 -> 5am (same day)
                    6 -> 6am (same day)
                    7 -> 7am (same day)
                    8 -> 8am (same day)
                    9 -> 9am (same day)
                    10 -> 10am (same day)
                    11 -> 11am (same day)

                    12 -> 12pm (noon) (same day)
                    */

                    //night (bedtime)
                    /* 
                    1 -> 1am (same day)
                    2 -> 2am (same day)
                    3 -> 3am (same day)
                    4 -> 4am (same day)
                    5 -> 5am (same day)
                    6 -> 6am (same day)
                    7 -> 7pm (a day before)
                    8 -> 8pm (a day before)
                    9 -> 9pm (a day before)
                    10 -> 10pm (a day before)
                    11 -> 11pm (a day before)

                    12 -> 12am (midnight) (a day before)
                    */

                    if (preferred === 'day') {
                        amPm = h < 4 ? 'pm' : 'am'
                        if (h === 12) {
                            amPm = 'pm'
                        }
                    } else {
                        amPm = h < 7 ? 'am' : 'pm'
                        if (h === 12) {
                            amPm = 'am'
                        }
                    }
                }

                if (h === 12 && m === 0) {
                    return {
                        h: amPm === 'am' ? (preferred === 'day' ? 24 : 0) : 12,
                        m: 0
                    }
                } else return {
                    h: h + (12 * (amPm === 'am' ? 0 : 1)),
                    m
                }
            }
        },
        {
            regex: new NamedRegExp("(?<namedtime>midnight|noon)$", "i"),
            parser: (obj: { namedtime: string }, preferred) => {
                switch (obj.namedtime) {
                    case "midnight":
                        return { h: 0, m: 0 }
                    case "noon":
                        return { h: 12, m: 0 }
                }
            }
        }
    ]



const templates: Array<{
    regex: RegExp,
    parser: (obj: any, anchor: { h: number, m: number }) => number
}> = [
        {
            regex: new NamedRegExp(`((?<multiple>[0-9]+)\\s+)?(?<ratio>quarter|quarters|half)\\s+(?<relative>past|to|after)\\s+${PLACEHOLDER_CLOCKTIME}`, "i"),
            parser: (obj: { multiple?: string, ratio: string, relative: string }, anchor) => {
                const multiple = obj.multiple ? Number.parseInt(obj.multiple) : 1
                const ratioMinute = obj.ratio.startsWith("half") ? 30 : (obj.ratio.startsWith("quarter") ? 15 : 0)
                const relative = obj.relative.startsWith("past") || obj.relative.startsWith("after") ? 1 : -1

                let minutes = anchor.h * 60 + anchor.m + (multiple * ratioMinute * relative)

                return minutes * 60
            }
        },
        {
            regex: new NamedRegExp(`(?<minute>[0-9]+)\\s+(?<direction>to|past|after)\\s+${PLACEHOLDER_CLOCKTIME}`, "i"),
            parser: (obj: { minute: string, direction: string, anchorHour: string }, anchor) => {

                const minute = Number.parseInt(obj.minute)
                const sign = obj.direction.startsWith("past") || obj.direction.startsWith("after") ? 1 : -1

                return (minute * sign * 60) + anchor.h * SECONDS_HOUR + anchor.m * 60
            }
        }
    ]



export function parseTimeOfTheDayTextToDiffSeconds(text: string, preferred: "day" | "night"): number {

    //Inspired by https://dlc.hypotheses.org/698
    //Test set

    //half past eleven
    //ten to seven
    //quarter to twelve
    //10:30
    //8 am
    //7 pm
    //7:30 am
    //ten o'clock

    //half past 10 pm
    //a quarter to noon
    //half past midnight

    //11 5 -> 'eleven five' is parsed as two numbers
    //730 => 'seven thirty' is automatically parsed as a whole number by speech-to-text libraries.
    /**
     *  15 -> 1:05
     *  115 -> 1:15 one fifteen
     *  11 15 -> eleven fifteen
     */

    //First, find the anchor time and replace it with a placeholder.
    let anchorTime: { h: number, m: number } = undefined
    for (const rule of clockTimeRules) {
        if (Array.isArray(rule.regex) === true) {
            for (const regex of rule.regex as Array<RegExp>) {
                const match = text.match(regex)
                if (match != null) {
                    text = text.replace(regex, PLACEHOLDER_CLOCKTIME)
                    anchorTime = rule.parser(match.groups, preferred)
                    break;
                }
            }
            continue;
        } else {
            const match = text.match(rule.regex as RegExp)
            if (match != null) {
                text = text.replace(rule.regex as RegExp, PLACEHOLDER_CLOCKTIME)
                anchorTime = rule.parser(match.groups, preferred)
                break;
            }
            continue;
        }
    }

    if (anchorTime) {

        let result: number = anchorTime.h * SECONDS_HOUR + anchorTime.m * 60
        for (const template of templates) {
            const match = text.match(template.regex)
            if (match) {
                result = template.parser(match.groups, anchorTime)
                break;
            }
        }

        //
        result = result % SECONDS_DAY
        if (preferred === 'night') {
            if (result >= BEDTIME_SHIFT_HOUR_OF_DAY * SECONDS_HOUR) {
                return result - SECONDS_DAY
            }
        }

        return result
    }

    return 0
}