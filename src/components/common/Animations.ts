export function interpWithFunction(callback:(value: number) => number, toValue: number, steps = 60) {
    let inputRange = [], outputRange = []
    /// input range 0-1
    for (let i=0; i<=steps; ++i) {
        let key = i/steps * toValue;
        inputRange.push(key);
        outputRange.push(callback(key));
    }
    return { inputRange, outputRange };
}

export const denialAnimationSettings = {
    timingConfig: {
        toValue: 3*2*Math.PI,
        duration: 300,
        useNativeDriver: true
    },
    interpolationConfig: interpWithFunction((value)=>5*Math.sin(value), 3 * 2 * Math.PI)
}