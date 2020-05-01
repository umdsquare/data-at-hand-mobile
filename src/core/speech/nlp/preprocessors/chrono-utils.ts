import { ParsedResult } from "chrono-node";
export function getBetweenText(text: string, result1: ParsedResult, result2: ParsedResult): string {
    const begin = result1.index + result1.text.length;
    const end = result2.index;
    return text.substring(begin, end);
}