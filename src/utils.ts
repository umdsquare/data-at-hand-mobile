export function sleep(milis: number): Promise<void>{
    return new Promise(resolve => setTimeout(resolve, milis));
}

export function getNumberSequence(from: number, to: number): Array<number>{
    const result = []
    for(let i = from; i <= to; i++ ){
        result.push(i)
    }

    return result
}


export function noop(k){ return k }