declare module "chrono-node" {
    export type ComponentName = "year" | "month" | "day" | "weekday"

    export class ParsedResult {
        start: ParsedComponents;
        end: ParsedComponents;
        index: number;
        text: string;
        ref: Date;
        tags: { [key: string]: boolean | string | undefined }

        isOnlyWeekday(): boolean

        constructor(params: {
            ref?: Date,
            text?: string,
            index?: number,
            start?: ParsedComponents | ComponentParams,
            end?: ParsedComponents | ComponentParams,
            tags?: { [key: string]: boolean | string | undefined }
        })
    }

    export interface ComponentParams {
        day?: number,
        month?: number,
        year?: number,
        weekday?: number
    }

    export class ParsedComponents {
        knownValues: { [key: string]: number };
        assign(component: ComponentName, value: number): void;
        imply(component: ComponentName, value: number): void;
        get(component: ComponentName): number;
        isCertain(component: ComponentName): boolean;
        date(): Date;

        dayjs(): any;

        constructor(params: ComponentParams, ref: Date)
    }

    export interface ChronoOptions {
        parsers: Array<Parser>
        refiners: Array<Refiner>
    }

    export interface ChronoParseOptions {
        forwardDate: boolean
    }

    export class Chrono {

        constructor(options: ChronoOptions)

        parseDate(text: string, refDate?: Date, opts?: any): Date;
        parse(text: string, refDate?: Date, opts?: ChronoParseOptions): ParsedResult[];
        parsers: Array<Parser>
        refiners: Array<Refiner>
    }

    export class Parser {
        pattern: () => RegExp
        extract: (text: string, ref: Date, match: RegExpMatchArray, options?: ChronoParseOptions) => ParsedResult | null
        findYearClosestToRef: (ref: Date, day: number, month: number) => number
    }

    export class Refiner {
        pattern: () => RegExp
        refine: (text: string, results: Array<ParsedResult>, opt?: ChronoParseOptions) => Array<ParsedResult>
    }

    export function parseDate(text: string, refDate?: Date, opts?: any): Date;
    export function parse(text: string, refDate?: Date, opts?: any): ParsedResult[];

}

declare module "chrono-node/src/parsers/parser" {
    export var ENWeekdayParser: () => any
    export var ENMonthNameParser: () => any
    export var ENRelativeDateFormatParser: () => any
    export var ENTimeExpressionParser: () => any

    export var findYearClosestToRef: (ref: Date, day: number, month: number) => number
}

declare module "chrono-node/src/refiners/refiner" {
    export var ENMergeDateRangeRefiner: () => any
}

declare module "chrono-node/src/options" {
    export const en: any
    export const commonPostProcessing: any
}

declare module "chrono-node/src/utils/EN" {
    export const MONTH_PATTERN: string
    export const MONTH_OFFSET: {[monthNameExpression: string]: number}
}