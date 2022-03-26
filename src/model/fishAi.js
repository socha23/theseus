import { vectorForPolar } from "./physics"
import { planMoveToPoint, planAttack } from "./agent"

export function fishAI(fish) { return new FishAI(fish)}


const DEFAULT_BEHAVIOR_PARAMS = {
    priority: 0,
    name: "Default behavior"
}

export class Behavior {
    constructor(entity, params) {
        this.params = {...DEFAULT_BEHAVIOR_PARAMS, ...params}
        this.entity = entity
    }

    get description() {
        return this.params.name
    }

    priority(model) {
        return this.params.priority
    }

    nextPlan(model) {
        throw new Error("NOT IMPLEMENTED")
    }
}

class RandomMoveBehavior extends Behavior {
    constructor(entity, params={}) {
        super(entity, {
            name: "Wandering",
            priority: 10,
            ...params})
    }

    nextPlan(model) {
        return planMoveToPoint(this.entity, randomPointInSight(this.entity.position, model, 50))
    }
}

class AggresiveBehavior extends Behavior {
    constructor(entity, params={}) {
        super(entity, {
            name: "Aggressive",
            priority: 20,
            ...params
        })
    }

    priority(model) {
        if (this.entity.distanceTo(model.sub) <= this.entity.sightRange) {
            return this.params.priority
        } else {
            return 0
        }
    }

    nextPlan(model) {
        return planAttack(this.entity, model.sub)
    }
}


const BEHAVIOR_CHECK_EVERY_MS = 100

export class FishAI {
    constructor(entity) {
        this.entity = entity
        this._plan = null

        this.currentBehavior = null
        this._sinceLastBehaviorChange = 0
        this.behaviors = [new RandomMoveBehavior(entity)]

        if (entity.aggresive) {
            this.behaviors.push(new AggresiveBehavior(entity))
        }
    }

    get targetPosition() {
        if (!this._plan) {
            return null
        }
        return this._plan.targetPosition
    }

    _updateBehavior(model) {
        this._sinceLastBehaviorChange = 0

        var maxPriority = -Infinity
        var nextBehavior = null
        this.behaviors.forEach(b => {
            if (b.priority(model) > maxPriority) {
                maxPriority = b.priority(model)
                nextBehavior = b
            }
        })
        if (this.currentBehavior != nextBehavior) {
            this.currentBehavior = nextBehavior
            this._plan = this.currentBehavior.nextPlan(model)
        }
    }

    updateState(deltaMs, model) {
        if (this.entity.alive) {
            this._sinceLastBehaviorChange += deltaMs
            if (!this.currentBehavior || (this._sinceLastBehaviorChange > BEHAVIOR_CHECK_EVERY_MS)) {
                this._updateBehavior(model)
            }

            if (!this._plan) {
                this._plan = this.currentBehavior.nextPlan(model)
            }
            this._plan.updateState(deltaMs, model)
            if (!this._plan.valid) {
                this._plan = null
            }
        }

    }

    get planDescription() {
        const result = []
        if (this.currentBehavior) {
            result.push(this.currentBehavior.description)
        }
        if (this._plan) {
            result.push(this._plan.name)
        }
        return result
    }
}

export function randomPointInSight(position, model, sightRange) {
    for (var i = 0; i < 100; i++) {
        const theta = Math.random() * 2 * Math.PI
        const dist = Math.random() * sightRange
        const posToCheck = position.plus(vectorForPolar(dist, theta))
        if (model.map.raycast(position, posToCheck) == null) {
            return posToCheck
        }
    }
    throw new Error("can't find point in sight")
}



