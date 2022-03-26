import { vectorForPolar } from "./physics"
import { planMoveToPoint, planAttack } from "./agent"

export function fishAI(fish) { return new FishAI(fish)}

export class FishAI {
    constructor(entity) {
        this.entity = entity
        this._plan = null
    }

    nextPlan(model) {
        if (this.entity.aggresive && this.entity.distanceTo(model.sub) <= this.entity.sightRange) {
            return planAttack(this.entity, model.sub)
        }
        return planMoveToPoint(this.entity, randomPointInSight(this.entity.position, model, 50))

    }

    get targetPosition() {
        if (!this._plan) {
            return null
        }
        return this._plan.targetPosition
    }

    updateState(deltaMs, model) {
        if (this.entity.alive) {
            if (!this._plan) {
                this._plan = this.nextPlan(model)
            }
            this._plan.updateState(deltaMs, model)
            if (!this._plan.valid) {
                this._plan = null
            }
        }

    }

    get planDescription() {
        if (this._plan === null) {
            return []
        }
        return [this._plan.name]
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



