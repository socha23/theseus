export function randomElem(list) {
    return list[Math.floor(Math.random()*list.length)];
}


export function randomEventOccured(deltaMs, everyS) {
    return Math.random() <  (deltaMs / (everyS * 1000))
}
