import { planMoveToPoint } from "./agent"
import { FishAI, randomPointInSight } from "./fishAi"
import { Point } from "./physics"

export function flockAI(flock) {
    return (entity => new FlockAI(entity, flock))
}

class FlockAI extends FishAI {
    constructor(entity, flock) {
        super(entity)
        this.flock = flock
    }

    nextPlan(model) {
        if (Math.random() < 0.1) {
            return planMoveToPoint(this.entity, randomPointInSight(this.entity.position, model, 100))
        } else {
            return planMoveToPoint(this.entity, this.flock.center)
        }
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
