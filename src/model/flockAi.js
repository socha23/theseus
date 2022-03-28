import { planMoveToPoint } from "./agent"
import { Behavior, FishAI, randomPointInSight } from "./fishAi"
import { Point } from "./physics"

export function flockAI(flock) {
    return (entity => new FlockAI(entity, flock))
}

class FlockBehavior extends Behavior {
    constructor(entity, flock, params = {}) {
        super(entity, {
            name: "Flocking",
            priority: 20,
            flockRange: 15,
            ...params
        })
        this.flock = flock
    }

    priority(model) {
        if (this.entity.distanceTo(this.flock.center) >= this.params.flockRange) {
            return this.params.priority
        } else {
            return 0
        }
    }

    nextPlan(model) {
        return planMoveToPoint(this.entity, this.flock.center, model.map, {mapSize: 5})
    }
}

class FlockAI extends FishAI {
    constructor(entity, flock) {
        super(entity)
        this.behaviors.push(new FlockBehavior(entity, flock))
    }
}

export class Flock {
    constructor() {
        this.entities = []
    }

    addEntity(entity) {
        this.entities.push(entity)
    }

    get center() {
        let x = 0
        let y = 0
        let count = 0
        this.entities.forEach(e => {
            x += e.position.x
            y += e.position.y
            count++
        })
        return new Point(x / count, y / count)
    }
}
