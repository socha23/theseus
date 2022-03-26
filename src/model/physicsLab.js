import { Body, Point, Vector } from "./physics";

class BodyProfile {
    constructor() {

    }
}


class AccProfile {
    constructor() {
        this.dataPoints = []
    }

    add(time, distance, speed) {
        this.dataPoints.push({time, distance, speed})
    }

    get maxSpeed() {
        return this.dataPoints[this.dataPoints.length - 1].speed
    }
}

class DecProfile {
    constructor() {
        this.dataPoints = []
    }

    add(time, distance, speed) {
        this.dataPoints.push({time, distance, speed})
    }
}


function calculateAccProfile(volume, force=1000, timeMs=10 * 1000, timeStep=200) {
    var state = {
        position: new Point(0, 0),
        speed: new Vector(0, 0)
    }
    const result = new AccProfile()

    const body = new Body(state.position, volume)
    for (var t = 0; t <= timeMs; t += timeStep) {
        const newState = body._projectSpeedAndPosition(timeStep / 1000, state.position, state.speed, 0, new Vector(force, 0))
        result.add(t, newState.position.x, newState.speed.length)
        state = newState
    }
    return result
}

function calculateDecProfile(volume, force=1000, speed=20, timeStep=200) {
    var state = {
        position: new Point(0, 0),
        speed: new Vector(speed, 0)
    }
    const body = new Body(state.position, volume)
    const result = new DecProfile()
    var t = 0
    result.add(t, 0, state.speed.length)

    while (state.speed.length > 0.1) {
        t += timeStep
        const newState = body._projectSpeedAndPosition(timeStep / 1000, state.position, state.speed, 0, new Vector(-force, 0))
        result.add(t, newState.position.x, newState.speed.length)
        state = newState
    }
    return result
}



export function calculateProfile(volume, accForce=1000, decForce=accForce, timeMs=10 * 1000, timeStep=200) {
    const acc = calculateAccProfile(volume, accForce, timeMs, timeStep)
    const dec = calculateDecProfile(volume, decForce, acc.maxSpeed, timeStep)
    const glide = calculateDecProfile(volume, 0, acc.maxSpeed, timeStep)

    return {acc, dec, glide}
}



