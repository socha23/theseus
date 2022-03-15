export function randomElem(list) {
    return list[Math.floor(Math.random()*list.length)];
}


export function randomEventOccured(deltaMs, everyS) {
    return Math.random() <  (deltaMs / (everyS * 1000))
}

export function jsonCompare(obj1, obj2) {
    return (JSON.stringify(obj1) === JSON.stringify(obj2))
}
