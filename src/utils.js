export function randomElem(list) {
    return list[Math.floor(Math.random()*list.length)];
}

export function randomVal(from, to) {
    return transpose(Math.random(), 0, 1, from, to)
}

export function randomEventOccured(deltaMs, everyS) {
    return Math.random() <  (deltaMs / (everyS * 1000))
}

export function jsonCompare(obj1, obj2) {
    return (JSON.stringify(obj1) === JSON.stringify(obj2))
}

export function transpose(val, aF, aT, bF=aF, bT=aT) {
    return bF + (bT - bF) * ((val - aF) / (aT - aF))
}

// results in (-Math.PI; Math.PI)
export function relativeAngle(from, to) {
    var delta = to - from
    if (delta > Math.PI) {
        delta -= 2 * Math.PI
    } else if (delta < -Math.PI) {
        delta += 2* Math.PI
    }
    return delta
}
