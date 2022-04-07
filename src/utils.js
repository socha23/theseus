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

export function paramValue(param, defaultVal) {
    param = param ?? defaultVal
    if (typeof(param) == "number") {
        return param
    } else if (param.from || param.to) {
        return randomVal(param.from, param.to)
    } else {
        return param
    }
}

export function paramFromValue(param) {
    if (typeof(param) == "number") {
        return param
    } else {
        return param.from
    }
}

export function paramColorValue(param) {
    if (typeof(param) == "string") {
        return param
    } else {
        const h = Math.floor(paramValue(param.h))
        const s = Math.floor(paramValue(param.s))
        const l = Math.floor(paramValue(param.l))
        return `hsl(${h}, ${s}%, ${l}%)`
    }

}
