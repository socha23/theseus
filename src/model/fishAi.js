import { Point, rectangle, Vector, vectorForPolar } from "./physics"
import { planMoveToPoint, planAttack, planBackOff, planStop, planRotateToPoint } from "./agent"
import { paramValue } from "../utils"
import { Path } from "./mapGeneration"


export function fishAI(fish) { return new FishAI(fish)}


const DEFAULT_BEHAVIOR_PARAMS = {
    priority: 0,
    name: "Default behavior"
}

export class Behavior {
    constructor(entity, params) {
        this.params = {...DEFAULT_BEHAVIOR_PARAMS, ...params}
        this.entity = entity
        this.plan = null
        this._active = false
    }

    get active() {
        return this._active
    }

    get description() {
        const result = [this.params.name]
        if (this.plan) {
            result.push(...this.plan.description)
        }
        return result
    }

    get targetPosition() {
        return this.plan?.targetPosition
    }

    priority(model) {
        return this.params.priority
    }

    nextPlan(model) {
        throw new Error("NOT IMPLEMENTED")
    }

    updateState(deltaMs, model) {
        if (this.active) {
            if (!this.plan) {
                this.plan = this.nextPlan(model)
            }
            this.plan.updateState(deltaMs, model)
            if (!this.plan.valid) {
                this.onPlanFinished()
                this.plan = null
                this.deactivate(model)
            }
        }
    }

    deactivate(model) {
        this._active = false
        this.onDeactivate(model)
    }

    activate(model) {
        this._active = true
        this.onActivate(model)
    }

    onPlanFinished(model) {

    }

    onDeactivate(model) {

    }

    onActivate(model) {

    }

    get valid() {
        return this.plan == null
    }
}

class RandomMoveBehavior extends Behavior {
    constructor(entity, params={}) {
        super(entity, {
            name: "Random Wandering",
            priority: 10,
            ...params})
    }

    nextPlan(model) {
        var point = randomPointInSight(this.entity.position, model.map, 5, 50)
        if (point == null) {
            point = randomPointInSight(this.entity.position, model.map, 0, 50)
        }
        return planMoveToPoint(this.entity, point, model.map, {mapSize: this.entity.radius * 2})
    }
}





class DontCrashIntoWalls extends Behavior {
    constructor(entity, params={}) {
        super(entity, {
            name: "Not crashing into walls",
            priority: 60,
            detectionTimeS: 3,
            avoidTimeS: 4,
            ...params})
    }

    priority(model) {
        if (this.drivingIntoWall(model.map) || this.active) {
            return this.params.priority
        }
        return 0
    }

    drivingIntoWall(map) {
        const dstPoint = this.entity.position.plus(this.entity.speedVector.scale(this.params.detectionTimeS))
        const hitbox = new Path(this.entity.position, dstPoint, this.entity.radius * 2).polygon()
        return map.detectCollision(hitbox) != null
    }


    onPlanFinished(model) {
        this.deactivate(model)
    }

    nextPlan(model) {
        for (var theta = Math.PI / 4; theta <= Math.PI; theta += Math.PI / 4) {
            for (var sign in [-1, 1]) {
                const dTheta = sign * theta
                const speed = vectorForPolar(this.entity.speedVector.length, this.entity.speedVector.theta + dTheta)
                const point = this.entity.position.plus(speed.scale(this.params.avoidTimeS))
                const hitboxWidth = this.entity.radius * 2
                const hitbox = new Path(this.entity.position, point, hitboxWidth).polygon()
                if (model.map.detectCollision(hitbox) == null) {
                    return planRotateToPoint(this.entity, point)
                }
            }
        }
        return planStop(this.entity)
    }
}

class BackOffFromWalls extends Behavior {
    constructor(entity, params={}) {
        super(entity, {
            name: "Backing off from walls",
            priority: 70,
            ...params})

        this.target = null
    }

    priority(model) {
        if (this.active || this.closeToWall(model)) {
            return this.params.priority
        }
        return 0
    }

    closeToWall(model, deltaX = 0, deltaY = 0) {
        const boxSide = this.entity.radius * 4
        const pos = new Point(this.entity.position.x + deltaX, this.entity.position.y + deltaY)
        const box = rectangle(pos, new Point(boxSide, boxSide))
        const collision = model.map.detectCollision(box)
        return (collision != null)
    }

    _findGoodTarget(model) {
        const fallbackLength = this.entity.radius * 10
        const fallbackWidth = this.entity.radius * 1.1

        var theta = (this.entity.orientation + Math.PI) % (2 * Math.PI)
        for (var i = 0; i < 100; i++) {
            const pos = this.entity.position.plus(vectorForPolar(fallbackLength, theta))
            const p = new Path(this.entity.position, pos, fallbackWidth).polygon()
            if (!model.map.detectCollision(p)) {
                return pos
            }
            theta = Math.random() * 2 * Math.PI
        }
        return null
    }

    nextPlan(model) {
        const target = this._findGoodTarget(model)
        if (target == null) {
            console.log("TELEPORT OUT")
            this.entity.body.teleportOutOfCollision(model.map)
        }
        return planBackOff(this.entity, target)
    }

    onPlanFinished(model) {
        this.deactivate(model)
    }

}


class TerritorialBehavior extends Behavior {
    constructor(entity, {position, range, ...params}) {
        super(entity, {
            name: "Wandering across territory",
            priority: 15,
            territorialSatisfyTime: {from: 1000, to: 5000},
            ...params})

        this.territoryCenter = position
        this.territoryRange = range

        this.currentTarget = null
        this.satisfactionMs = paramValue(this.params.territorialSatisfyTime)
    }

    priority(model) {
        if (this.satisfactionMs < 0) {
            return this.params.priority
        } else {
            return 0
        }
    }

    onPlanFinished(model) {
        this.satisfactionMs = paramValue(this.params.territorialSatisfyTime)
        this.deactivate(model)
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        this.satisfactionMs -= deltaMs
    }

    nextPlan(model) {
        this.currentTarget = randomPointInPerimeter(
            this.entity.position,
            model.map,
            this.entity.radius,
            this.territoryCenter, this.territoryRange)
        if (this.currentTarget === null) {
            this.currentTarget = randomPointInPerimeter(
                this.entity.position,
                model.map,
                0,
                this.territoryCenter,
                this.territoryRange
            )
        }
        if (this.currentTarget === null) {
            this.currentTarget = randomPointInSight(this.entity.position, model.map, 0, this.entity.sightRange)
        }
        if (this.currentTarget === null) {
            console.log("NO TARGET")
        }

        return planMoveToPoint(this.entity, this.currentTarget, model.map,
            {tailForce: 0.5 * this.entity.tailForce, mapSize: this.entity.radius}
            )
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
        return planAttack(this.entity, model.sub, model.map, {mapSize: this.entity.radius * 2})
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
            new BackOffFromWalls(entity),
            new DontCrashIntoWalls(entity),
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

        this._initialized = false
    }

    get targetPosition() {
        if (!this.currentBehavior) {
            return null
        }
        return this.currentBehavior.targetPosition
    }

    _updateBehavior(model) {
        if (this._initialized) {
            this._sinceLastBehaviorChange = 0
        } else {
            // so not all beh checks happen at same time
            this._sinceLastBehaviorChange = Math.random() * BEHAVIOR_CHECK_EVERY_MS
            this._initialized = true
        }

        var maxPriority = -Infinity
        var nextBehavior = null
        this.behaviors.forEach(b => {
            if (b.priority(model) > maxPriority) {
                maxPriority = b.priority(model)
                nextBehavior = b
            }
        })
        if (this.currentBehavior != nextBehavior) {
            if (this.currentBehavior != null) {
                this.currentBehavior.deactivate(model)
            }
            this.currentBehavior = nextBehavior
            this.currentBehavior.activate(model)

        }
    }

    updateState(deltaMs, model) {
        if (this.entity.alive) {
            this.behaviors.forEach(b => b.updateState(deltaMs, model))
            this._sinceLastBehaviorChange += deltaMs
            if (!this.currentBehavior || !this.currentBehavior.active || (this._sinceLastBehaviorChange > BEHAVIOR_CHECK_EVERY_MS)) {
                this._updateBehavior(model)
            }
        }

    }

    get planDescription() {
        return this.currentBehavior?.description ?? []
    }
}


function randomPointInPerimeter(position, map, mapSize, perimeterCenter, perimeterRange) {

    return lookForPointInSight(position,map, mapSize, () => {
        const theta = Math.random() * 2 * Math.PI
        return perimeterCenter.plus(vectorForPolar(perimeterRange, theta))
    })
}


export function randomPointInSight(position, map, mapSize, sightRange) {
    return lookForPointInSight(position,map,mapSize, () => {
        const theta = Math.random() * 2 * Math.PI
        const dist = Math.random() * sightRange
        return position.plus(vectorForPolar(dist, theta))
    })
}

function lookForPointInSight(position, map, mapSize, pointCreator=() => Point.ZERO) {
    for (var i = 0; i < 100; i++) {
        const posToCheck = pointCreator()
        const rect = rectangle(position, new Point(0.5, 0.5))
        const collision = map.detectCollision(rect, mapSize)
        const cast = map.raycast(position, posToCheck, mapSize)

        if (collision == null && cast == null) {
            return posToCheck
        }
    }
    return null
}
