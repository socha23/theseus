import { Point, rectangle, Vector, vectorForPolar } from "./physics"
import { planFollow, planMoveToPoint, planAttack, planBackOff, planStop, planRotateToPoint } from "./agent"
import { paramValue, randomElem } from "../utils"
import { Path } from "./mapGeneration"


export function fishAI(fish) { return new FishAI(fish)}


const BEHAVIOR_CHECK_EVERY_MS = 100

export class FishAI {
    constructor(entity) {
        this.entity = entity
        this._plan = null

        this.currentBehavior = null
        this._sinceLastBehaviorChange = 0
        this.behaviors = []
        this._initialized = false

        this.subFear = 0
    }


    init(model) {
        this.behaviors.push(
            new RandomMoveBehavior(this.entity),
            new BackOffFromWalls(this.entity),
            new DontCrashIntoWalls(this.entity),
            new FearTheSub(this.entity, model.sub),
        )
        if (this.entity.aggresive) {
            this.behaviors.push(new AggresiveBehavior(this.entity))
        }
        if (this.entity.params.territoryRange > 0) {
            this.behaviors.push(new TerritorialBehavior(this.entity, {
                position: this.entity.position,
                range: this.entity.params.territoryRange,
            }))
        }
        if (this.entity.params.flocking) {
            this.behaviors.push(new FlockBehavior(this.entity, this.entity.params.flocking))
        }
    }

    get targetPosition() {
        if (!this.currentBehavior) {
            return null
        }
        return this.currentBehavior.targetPosition
    }

    updateState(deltaMs, model) {
        if (!this.entity.alive) {
            return
        }

        this.behaviors.forEach(b => b.updateState(deltaMs, model))
        this._sinceLastBehaviorChange += deltaMs
        if (!this.currentBehavior || !this.currentBehavior.active) {
            this._updateBehavior(model, false)
        }

        if (this._sinceLastBehaviorChange > BEHAVIOR_CHECK_EVERY_MS) {
            this._updateBehavior(model, true)
        }

        this.subFear = Math.max(0, Math.min(100, this.entity.pain))
    }

    _updateBehavior(model, preserveCurrentPlan=true) {
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
        if (preserveCurrentPlan && nextBehavior == this.currentBehavior) {
            // no plan switch
        } else {
            if (this.currentBehavior != null) {
                this.currentBehavior.deactivate(model)
            }
            this.currentBehavior = nextBehavior
            this.currentBehavior.activate(model)

        }
    }


    get planDescription() {
        return this.currentBehavior?.description ?? []
    }

    addBehavior(behavior) {
        this.behaviors.push(behavior)
    }
}

///////////
// BEHAVIOR
//////////

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
        } else {
            result.push("No plan")
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
            this.plan.updateState(deltaMs, model)
            if (!this.plan.valid) {
                this.onPlanFinished()
                this.deactivate(model)
            }
        }
    }

    deactivate(model) {
        this._active = false
        this.plan = null
        this.onDeactivate(model)
    }

    activate(model) {
        this._active = true
        this.plan = this.nextPlan(model)
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



///////////
// BEHAVIORS
//////////

class BackOffFromWalls extends Behavior {
    constructor(entity, params={}) {
        super(entity, {
            name: "Backing off from walls",
            priority: 110,
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

}


class DontCrashIntoWalls extends Behavior {
    constructor(entity, params={}) {
        super(entity, {
            name: "Not crashing into walls",
            priority: 100,
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
        const dstPoint = this.entity.position.plus(this.entity.speed.scale(this.params.detectionTimeS))
        const hitbox = new Path(this.entity.position, dstPoint, this.entity.radius * 2).polygon()
        return map.detectCollision(hitbox) != null
    }

    nextPlan(model) {
        for (var theta = Math.PI / 4; theta <= Math.PI; theta += Math.PI / 4) {
            for (var sign in [-1, 1]) {
                const dTheta = sign * theta
                const speed = vectorForPolar(this.entity.speed.length, this.entity.speed.theta + dTheta)
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


class AvoidEntity extends Behavior {
    constructor(entity, targetEntity, params={}) {
        super(entity, {
            name: "Avoiding " + targetEntity.id,
            priority: 80,
            engageDistance: 50,
            lookupDistance: 50,
            ...params})
        this.targetEntity = targetEntity
    }

    priority(model) {
        if (this.entity.position.distanceTo(this.targetEntity.position) <= this.engageDistance) {
            return this.params.priority
        }
        return 0
    }

    get engageDistance() {
        return this.params.engageDistance
    }

    nextPlan(model) {
        // find theta that offers gaining the most distance without collision, move there
        var bestPoint = null
        var bestDistance = 0

        for (var theta = 0; theta <= Math.PI; theta += Math.PI / 8) {
            for (var sign in [-1, 1]) {
                const dTheta = sign * theta
                var destPoint = this.entity.position.plus(vectorForPolar(this.params.lookupDistance, dTheta + this.entity.orientation))
                const col = model.map.raycast(this.entity.position, destPoint, this.entity.radius * 4)
                if (col) {
                    destPoint = col.point
                }
                if (this.targetEntity.position.distanceTo(destPoint) > bestDistance) {
                    bestDistance = this.targetEntity.position.distanceTo(destPoint)
                    bestPoint = destPoint
                }
            }
        }
        return planMoveToPoint(this.entity, bestPoint, model.map)
    }
}

class FearTheSub extends AvoidEntity {
    constructor(entity, sub, params={}) {
        super(entity, sub, {
            name: "Fearing the sub",
            priority: 80,
            engageDistance: 60,
            ...params
        })
    }

    priority(model) {
        const result = (super.priority(model) > 0) ? this.entity.subFear : 0
        return result
    }
}





class AggresiveBehavior extends Behavior {
    constructor(entity, params={}) {
        super(entity, {
            name: "Aggressive",
            priority: 25,
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
            var x = 0;
            var y = 0;
            pals.forEach(p => {
                x += p.position.x
                y += p.position.y
            })
            const center = new Point(x / pals.length, y / pals.length)

            var minDistance = Infinity
            var bestPal = null
            pals.forEach(pal => {
                if (pal.position.distanceTo(center) < minDistance) {
                    minDistance = pal.position.distanceTo(center)
                    bestPal = pal
                }
            })
            return planFollow(this.entity, bestPal, {distanceTolerance: paramValue(this.params.flockRange)})
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


///////////
// UTILS
//////////


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
