export function sleep(milis: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milis));
}

export function getNumberSequence(from: number, to: number): Array<number> {
    const result = []
    for (let i = from; i <= to; i++) {
        result.push(i)
    }

    return result
}


export function noop(k: any) { return k }


export const STRING_SET_ALPHABETS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const STRING_SET_NUMBERS = '0123456789'

export function randomString(length: number = 5, set: string = STRING_SET_ALPHABETS): string {

    const result = new Array<String>(length)
    for (let i = 0; i < result.length; i++) {
        result[i] = set.charAt(Math.random() * (set.length - 1))
    }
    return result.join("")
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(value, min))
}

export class Lazy<T>{
    private _instance: T | undefined = undefined
    constructor(readonly generator: () => T) { }

    get(): T {
        if (this._instance == null) {
            this._instance = this.generator()
        }
        return this._instance!
    }
}


export function coverValueInRange(range: [number, number], value: number | undefined | null): [number, number] {
    if (value != null) {
        range[0] = Math.min(range[0], value)
        range[1] = Math.max(range[1], value)
    }
    return range
}