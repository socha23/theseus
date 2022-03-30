import { Point, rectangle, vectorForPolar } from "./physics"
import { planMoveToPoint, planAttack, planBackOff, planStop, planRotateToPoint } from "./agent"
import { randomElem } from "../utils"
import { STATISTICS } from "../stats"
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
        if (!this.plan) {
            this.plan = this.nextPlan(model)
        }
        this.plan.updateState(deltaMs, model)
        if (!this.plan.valid) {
            this.plan = null
        }
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
            timeS: 2,
            ...params})
    }

    priority(model) {
        if (this.drivingIntoWall(model.map) || this.plan?.valid) {
            return this.params.priority
        }
        return 0
    }

    drivingIntoWall(map) {
        const dstPoint = this.entity.position.plus(this.entity.speed * this.params.timeS)
        const hitbox = new Path(this.entity.position, dstPoint, this.entity.radius * 2).polygon()
        return map.getPolygonsIntersecting(hitbox).length > 0
    }

    nextPlan(model) {
        for (var theta = Math.PI / 4; theta < Math.PI; theta += Math.PI / 4) {
            for (var sign in [-1, 1]) {
                const dTheta = sign * theta
                const speed = vectorForPolar(this.entity.speedVector.length, speed.theta + dTheta)
                const point = this.entity.position.plus(vectorForPolar(10, speed.theta + dTheta))
                const hitbox = new Path(this.entity.position, point, this.entity.radius * 4).polygon()
                if (model.map.getPolygonsIntersecting(hitbox).length === 0) {
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
        this.lastTheta = 0
        this.goodThetas = []
        this._active = false
    }

    priority(model) {
        if (this._active || this.closeToWall(model)) {
            return this.params.priority
        }
        return 0
    }

    closeToWall(model, deltaX = 0, deltaY = 0) {
        const RADIUS_MUTLIPLIER = 2
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

       return result
    }

    updateState(deltaMs, model) {
        this.goodThetas = this.findGoodThetas(model)
        if (this.goodThetas.length == 0) {
            this.entity.body.teleportOutOfCollision(model.map)
        }

        if (!this.goodThetas.find(a => (a == this.lastTheta))) {
            this.plan = null
        }
        super.updateState(deltaMs, model)
        if (this.plan == null) {
            this._active = false
        }
    }

    onActivate(model) {
        this._active = true
    }


    nextPlan(model) {
        this.lastTheta = randomElem(this.goodThetas)
        return planBackOff(this.entity, this.lastTheta, 4 * this.entity.radius, model.map)
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
        this.timeSincePlanChange = 0
        this.currentTarget = null
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        this.timeSincePlanChange += deltaMs
        if (this.timeSincePlanChange > 30 * 1000) {
            this.timeSincePlanChange = 0
            this.plan = null
        }
    }

    get targetPosition() {
        return this.currentTarget
    }

    nextPlan(model) {
        this.currentTarget = randomPointInPerimeter(this.entity.position, model.map, 5, this.position, this.range)
        if (this.currentTarget === null) {
            this.currentTarget = randomPointInPerimeter(this.entity.position, model.map, 0, this.position, this.range)
        }
        if (this.currentTarget === null) {
            this.currentTarget = randomPointInSight(this.entity.position, model.map, 0, this.position, this.entity.sightRange)
        }

        return planMoveToPoint(this.entity, this.currentTarget, model.map,
            {tailForce: 0.5 * this.entity.tailForce, mapSize: 5}
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
            this.currentBehavior = nextBehavior
            this.currentBehavior.onActivate(model)

        }
    }

    updateState(deltaMs, model) {
        if (this.entity.alive) {
            this._sinceLastBehaviorChange += deltaMs
            if (!this.currentBehavior || (this._sinceLastBehaviorChange > BEHAVIOR_CHECK_EVERY_MS)) {
                this._updateBehavior(model)
            }
            this.currentBehavior.updateState(deltaMs, model)
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


function randomPointInSight(position, map, mapSize, sightRange) {
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
