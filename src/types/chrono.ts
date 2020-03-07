  
// chrono-node type definitions
// Forked from https://github.com/Microsoft/BotBuilder

export declare module Chrono {
    export type ComponentName = "year"|"month"|"day"

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

    export function parseDate(text: string, refDate?: Date, opts?: any): Date;
    export function parse(text: string, refDate?: Date, opts?: any): ParsedResult[];
}