import { toHaveStyle } from "@testing-library/jest-dom/dist/matchers"
import { paramValue, randomElem } from "../utils"
import { planFollow, planMoveToPoint } from "./agent"
import { Behavior, FishAI, randomPointInSight } from "./fishAi"
import { Point } from "./physics"

export function flockAI() {
    return (entity => new FlockAI(entity))
}

class FlockBehavior extends Behavior {
    constructor(entity, params = {}) {
        super(entity, {
            name: "Flocking",
            priority: 20,
            flockRange: 10,
            flockSatisfyTime: {from: 1000, to: 5000},
            ...params
        })
        this.satisfactionMs = paramValue(this.params.flockSatisfyTime)
    }

    priority(model) {
        if (this.satisfactionMs < 0) {
            return this.params.priority
        } else {
            return 0
        }
    }

    _perceivedPals(model) {
        return model.map
            .getEntitiesAround(this.entity.position, this.entity.sightRange)
            .filter(e => e != this.entity && e.species === this.entity.species && e.alive)

    }

    nextPlan(model) {
        const pals = this._perceivedPals(model)
        if (pals.length > 0) {
            return planFollow(this.entity, randomElem(pals), {distanceTolerance: paramValue(this.params.flockRange)})
        } else {
            const dest = randomPointInSight(this.entity.position, model.map, this.entity.radius, this.entity.sightRange)
            return planMoveToPoint(this.entity, dest, model.map, {mapSize: this.entity.radius})
        }
    }


    onPlanFinished(model) {
        this.satisfactionMs = paramValue(this.params.flockSatisfyTime)
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        this.satisfactionMs -= deltaMs
    }
}

class FlockAI extends FishAI {
    constructor(entity) {
        super(entity)
        this.behaviors.push(new FlockBehavior(entity))
    }
}

