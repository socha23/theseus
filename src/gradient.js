/* def is like
[
    {time: 0, value: 0},
    {time: 0.5, value: 128},
    {time: 1, value: 255},
]
*/

export function rgbGradientValue(value, definition) {
    const rDef = definition.map(s => ({time: s.time, value: parseInt(s.value.slice(1, 3), 16)}))
    const gDef = definition.map(s => ({time: s.time, value: parseInt(s.value.slice(3, 5), 16)}))
    const bDef = definition.map(s => ({time: s.time, value: parseInt(s.value.slice(5, 7), 16)}))
    return "rgb(" + gradientValue(value, rDef) + "," + gradientValue(value, gDef) + "," + gradientValue(value, bDef) + ")"
}


export function gradientValue(time, definition) {
    var lastFrame = {time: 0, value: 0}
    for (var i = 0; i < definition.length; i++) {
        const currentFrame = definition[i]
        if (time <= currentFrame.time) {
            return transpose(time, lastFrame.time, currentFrame.time, lastFrame.value, currentFrame.value)
        }
        lastFrame = currentFrame
    }
    return lastFrame.value
}

export function transpose(val, aF, aT, bF=aF, bT=aT) {
    return bF + (bT - bF) * ((val - aF) / (aT - aF))
}
