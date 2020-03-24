
// chrono-node type definitions

import { ChronoOptions, Parser, Refiner } from "chrono-node";

// Forked from https://github.com/Microsoft/BotBuilder
export function mergeChronoOptions(options: Array<ChronoOptions | (() => ChronoOptions)>): ChronoOptions {

    const mergedOption = {
        parsers: new Array <Parser>(),
        refiners: new Array<Refiner>()
        } as ChronoOptions

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

    return mergedOption
}

