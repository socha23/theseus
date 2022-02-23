import {Point, Vector} from "./physics"

class Plan {
    constructor(id) {
        this.id = id
    }

    isValid() {
        return false
    }

    updateState(deltaMs, entity, model) {
    }
}

class Wait extends Plan {
    constructor(id, waitTimeS) {
        super(id)
        this.waitTime = waitTimeS * 1000
    }

    isValid() {
        return this.waitTime > 0
    }

    updateState(deltaMs, entity, model) {
        super.updateState(deltaMs, entity, model)
        this.waitTime -= deltaMs
    }
}

export class MovePlan extends Plan {
    constructor(id, distanceTolerance = 1) {
        super(id)
        this.target = null
        this.position = null
        this.distanceTolerance = distanceTolerance
    }

    updateState(deltaMs, entity, model) {
        this.position = entity.getPosition()
    }

    isValid() {
        if (this.position == null || this.target == null) {
            return false
        }
        return this.target.distanceTo(this.position) > this.distanceTolerance
    }
}

function randomPointAround(point, distance) {
    const dx = 2 * (Math.random() - 0.5) * distance
    const dy = 2 * (Math.random() - 0.5) * distance
    return point.plus(new Vector(dx, dy))
}


export class MoveTo extends MovePlan {
    constructor(id, target, distance) {
        super(id, distance)
        this.target = target
    }

}

export class Follow extends MovePlan {
    constructor(entity, targetEntity, distance) {
        super(entity.id + "_follo", distance)
        this.targetEntity = targetEntity
    }

    updateState(deltaMs, entity, model) {
        super.updateState(deltaMs, entity, model)
        this.target = this.targetEntity.getPosition()
    }

}

export class MoveAround extends MoveTo {
    constructor(entity, distance) {
        super(entity.id + "_move_around",
            randomPointAround(entity.getPosition(), distance),
            10)
    }
}

export class Agent {
    constructor() {
        this.currentPlan = null
    }

    updateState(deltaMs, entity, model) {
        if (this.currentPlan == null) {
            this.currentPlan = this._nextPlan(entity, model)
        }
        this.currentPlan.updateState(deltaMs, entity, model)
        if (!this.currentPlan.isValid()) {
            this.currentPlan = null
        }
    }

    _nextPlan(entity, model) {
        return new Wait(entity.id + "_plan_wait_1", 1)
    }
}

export class FishAgent extends Agent {
    constructor() {
        super()
    }

    _nextPlan(entity, model) {
        const plan = Math.random()
        if (plan < 0.5) {
            return new MoveAround(entity, 50)
        } else {
            return new Follow(entity, model.sub, 20)
        }
    }
}

export class MoveToFlockCenter extends MoveTo {
    constructor(entity, flock) {
        super(entity.id + "_move_to_flock_center",
            randomPointAround(flock.getCenter(), 7),
            5)
    }
}


export class FlockAgent extends FishAgent {
    constructor(flock) {
        super()
        this.flock = flock
    }

    _nextPlan(entity, model) {
        if (Math.random() < 0.1) {
            return new MoveAround(entity, 100)
        } else {
            return new MoveToFlockCenter(entity, this.flock)
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

    getCenter() {
        let x = 0
        let y = 0
        let count = 0
        this.entities.forEach(e => {
            x += e.getPosition().x
            y += e.getPosition().y
            count++
        })
        return new Point(x / count, y / count)
    }
}
