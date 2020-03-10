const comparisonCategories = {
    'less': ['earl', 'low', 'small', 'short', 'less', 'slow'],
    'more': ['late', 'high', 'big', 'large', 'long', 'more', 'fast']
}

const comparisonTermDict: { [key: string]: string } = {}

Object.keys(comparisonCategories).forEach(category => {
    comparisonCategories[category].forEach(word => {
        comparisonTermDict[word] = category
    })
})

export function categorizeExtreme(extreme: string): "min" | "max" | null {
    if (/(max)|(maximum)|(latest)|(fastest)|(most)/gi.test(extreme)) {
        return "max"
    } else if (/(min)|(minimum)|(earliest)|(slowest)|(least)/gi) {
        return "min"
    } else return null
}

export function categorizeComparison(comparison: string): 'less' | 'more' | null {
    const matchedTerm = Object.keys(comparisonTermDict).find(term => comparison.search(term) != -1)
    if(matchedTerm){
        return comparisonTermDict[matchedTerm] as any
    }else return null
}