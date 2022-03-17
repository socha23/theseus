import {Point, Vector} from "./physics"

var autoinc = 0

class Plan {
    constructor() {
        this.id = "plan" + autoinc++
        this.description = "Abstract plan"
    }

    isValid() {
        return false
    }

    updateState(deltaMs, entity, model) {
    }
}

class Wait extends Plan {
    constructor(waitTimeS) {
        super()
        this.description = "Wait " + waitTimeS  + "s"
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

export class BackOff extends Plan {
    constructor(fromPosition, minDistance = 1) {
        super()
        this.description = "Back off"
        this.position = fromPosition
        this.fromPosition = fromPosition
        this.minDistance = minDistance
    }

    updateState(deltaMs, entity, model) {
        this.position = entity.getPosition()
    }

    isValid() {
        return this.position.distanceTo(this.fromPosition) < this.minDistance
    }

}

export class MovePlan extends Plan {
    constructor(distanceTolerance = 1) {
        super()
        this.description = "Abstract move plan"
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

export function randomPointAround(point, distance) {
    const dx = 2 * (Math.random() - 0.5) * distance
    const dy = 2 * (Math.random() - 0.5) * distance
    return point.plus(new Vector(dx, dy))
}


export class MoveTo extends MovePlan {
    constructor(target, distance) {
        super(distance)
        this.description = `Move to ${target.x.toFixed(1)}, ${target.y.toFixed(1)}`
        this.target = target
    }

}

export class Follow extends MovePlan {
    constructor(entity, targetEntity, distance) {
        super(distance)
        this.description = `Follow ${targetEntity.id}`
        this.targetEntity = targetEntity
    }

    updateState(deltaMs, entity, model) {
        super.updateState(deltaMs, entity, model)
        this.target = this.targetEntity.getPosition()
    }

}

export class MoveAround extends MoveTo {
    constructor(entity, distance) {
        super(randomPointAround(entity.getPosition(), distance), 10)
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

    resetPlan() {
        this.currentPlan = null
    }

    _nextPlan(entity, model) {
        return new Wait(1)
    }
}

