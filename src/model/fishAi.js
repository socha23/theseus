import { Point, rectangle, vectorForPolar } from "./physics"
import { planMoveToPoint, planAttack, planBackOff } from "./agent"
import { randomElem } from "../utils"
import { STATISTICS } from "../stats"


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


class DontCrashIntoWalls extends Behavior {
    constructor(entity, params={}) {
        super(entity, {
            name: "Not crashing into walls",
            priority: 80,
            ...params})
    }

    priority(model) {
        if (this.drivingIntoWall(model)) {
            return this.params.priority
        }
        return 0
    }

    drivingIntoWall(model) {
        return (this.entity.body.willCrashIntoWall(model, 1) != null)
    }

    nextPlan(model) {
        const crash = this.entity.body.willCrashIntoWall(model, 1)
        return planBackOff(this.entity, crash.wallNormal.theta)
    }
}

class AvoidWalls extends Behavior {
    constructor(entity, params={}) {
        super(entity, {
            name: "Avoiding walls",
            priority: 70,
            ...params})
    }

    priority(model) {
        if (this.closeToWall(model)) {
            return this.params.priority
        }
        return 0
    }

    closeToWall(model, deltaX = 0, deltaY = 0) {

        const RADIUS_MUTLIPLIER = 4
        const boxSide = this.entity.radius * RADIUS_MUTLIPLIER
        const pos = new Point(this.entity.position.x + deltaX, this.entity.position.y + deltaY)
        const box = rectangle(pos, new Point(boxSide, boxSide))
        const collision = model.map.detectCollision(box)

        return (collision != null)
    }

    findGoodThetas(model) {
        const result = []
        const DELTA = 2 * this.entity.radius

        if (!this.closeToWall(model, DELTA, 0)) {
            result.push(0)
        }
        if (!this.closeToWall(model, DELTA, DELTA)) {
           result.push(Math.PI / 4)
        }
        if (!this.closeToWall(model, 0, DELTA)) {
            result.push(Math.PI / 2)
        }
        if (!this.closeToWall(model, -DELTA, DELTA)) {
            result.push(3 * Math.PI / 4)
        }
       if (!this.closeToWall(model, -DELTA, 0)) {
            result.push(Math.PI)
       }
       if (!this.closeToWall(model, -DELTA, -DELTA)) {
            result.push(5 * Math.PI / 4)
        }
        if (!this.closeToWall(model, 0, -DELTA)) {
            result.push(6 * Math.PI / 4)
        }
        if (!this.closeToWall(model, DELTA, -DELTA)) {
            result.push(7 * Math.PI / 4)
        }

       if (result.length == 0 ) {
           console.log("No good spots")
       }

       return result
    }

    nextPlan(model) {
        const goodThetas = this.findGoodThetas(model)
        const theta = randomElem(goodThetas)
        return planBackOff(this.entity, theta, 5 * this,this.entity.radius)
    }
}


class TerritorialBehavior extends Behavior {
    constructor(entity, {position, range, ...params}) {
        super(entity, {
            name: "Wandering across territory",
            priority: 15,
            ...params})
        this.position = position
        this.range = range
    }

    nextPlan(model) {
        return planMoveToPoint(this.entity, randomPointInPerimeter(this.entity.position, model, this.position, this.range))
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
        this.behaviors = [
            new RandomMoveBehavior(entity),
            new AvoidWalls(entity),
        ]

        if (entity.aggresive) {
            this.behaviors.push(new AggresiveBehavior(entity))
        }
        if (entity.params.territoryRange > 0) {
            this.behaviors.push(new TerritorialBehavior(entity, {
                position: entity.position,
                range: entity.params.territoryRange,
            }))
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


function randomPointInPerimeter(position, model, perimeterCenter, perimeterRange) {

    //return lookForPointInSight(position,model,() => {
        const theta = Math.random() * 2 * Math.PI
        return perimeterCenter.plus(vectorForPolar(perimeterRange, theta))
    //})
}


function randomPointInSight(position, model, sightRange) {
    return lookForPointInSight(position,model,() => {
        const theta = Math.random() * 2 * Math.PI
        const dist = Math.random() * sightRange
        return position.plus(vectorForPolar(dist, theta))
    })
}

function lookForPointInSight(position, model, pointCreator=() => Point.ZERO) {
    for (var i = 0; i < 100; i++) {
        const posToCheck = pointCreator()
        if (model.map.raycast(position, posToCheck) == null) {
            return posToCheck
        }
    }
    throw new Error("can't find point in sight")
}
