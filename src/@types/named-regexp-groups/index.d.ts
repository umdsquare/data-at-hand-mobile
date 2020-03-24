declare module "named-regexp-groups" {
    export default class NamedRegExp implements RegExp{
        constructor(regex: string | RegExp, flags?: string)
        exec(string: string): RegExpExecArray;
        test(string: string): boolean;
        source: string;
        global: boolean;
        ignoreCase: boolean;
        multiline: boolean;
        lastIndex: number;
        compile(): this;
        flags: string;
        sticky: boolean;
        unicode: boolean;
        [Symbol.match](string: string): RegExpMatchArray;
        [Symbol.replace](string: string, replaceValue: string): string;
        [Symbol.replace](string: string, replacer: (substring: string, ...args: any[]) => string): string;
        [Symbol.search](string: string): number;
        [Symbol.split](string: string, limit?: number): string[];
        dotAll: boolean;
    }
}