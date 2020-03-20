
// chrono-node type definitions
// Forked from https://github.com/Microsoft/BotBuilder

export declare module Chrono {
    export type ComponentName = "year" | "month" | "day"

    export class ParsedResult {
        start: ParsedComponents;
        end: ParsedComponents;
        index: number;
        text: string;
        ref: Date;
    }

    export class ParsedComponents {
        assign(component: ComponentName, value: number): void;
        imply(component: ComponentName, value: number): void;
        get(component: ComponentName): number;
        isCertain(component: ComponentName): boolean;
        date(): Date;
    }

    export class ChronoInstance {
        parseDate(text: string, refDate?: Date, opts?: any): Date;
        parse(text: string, refDate?: Date, opts?: any): ParsedResult[];
        parsers: Array<any>
        refiners: Array<any>
    }

    export function parseDate(text: string, refDate?: Date, opts?: any): Date;
    export function parse(text: string, refDate?: Date, opts?: any): ParsedResult[];

}

export function mergeChronoOptions(options: Array<any>) {

    const mergedOption = {
        parsers: [],
        refiners: []
    }

    options.forEach(option => {
        if (typeof option === 'function') {
            option = option()
        }

        option.parsers?.forEach(p => {
            mergedOption.parsers.push(p);
        })

        option.refiners?.forEach(r => {
            mergedOption.refiners.push(r);
        })
    })

    console.log("merged result parsers:", mergedOption.parsers.length, "refiners:", mergedOption.refiners.length)

    return mergedOption
}