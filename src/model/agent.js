import { relativeAngle, transpose } from "../utils"
import { Point, rectangle, vectorForPolar } from "./physics"

function randomPointInSight(entity, model, sightRangeTo, sightRangeFrom = 0, relativeAngleMax = Math.PI, maxTries = 10) {
    for (var i = 0; i < maxTries; i++) {
        const range = transpose(Math.random(), 0, 1, sightRangeFrom, sightRangeTo)
        const relAngle = transpose(Math.random(), 0, 1, -relativeAngleMax, relativeAngleMax)

        const target = entity.position.plus(vectorForPolar(range, entity.body.speed.theta + relAngle))

        if (!model.map.raycast(entity.position, target)) {
            return target
        }

    }
    return null
}

/////////
// ACTIONS
/////////

export class AgentAction {
    constructor(entity, params = {}) {
        this.params = {description: "", ...params}
        this._done = false
        this.entity = entity
    }

    get me() {
        return this.entity
    }

    get finished() {
        return this._done
    }

    get targetPosition() {
        return null
    }

    get description() {
        return this.params.description
    }

    finish() {
        this._done = true
    }

    canBeFinished(model) {
        return false
    }

    updateState(deltaMs, model) {
        if (this.canBeFinished(deltaMs, model)) {
            this.finish()
        }
    }
}

function _adjustRotation(fish, theta, deltaMs, rotateSpeed = true) {
    // rotate towards target
    const relAngle = relativeAngle(fish.orientation, theta) + Math.PI / 16
    const rotSpeed = fish.rotationSpeed * Math.sign(relAngle)
    fish.body.rotationSpeed = rotSpeed
    if (rotateSpeed) {
        fish.body.speed = fish.body.speed.withTheta(fish.orientation)
    }

}

function _applyTail(fish, tailForce=fish.tailForce) {
    if (fish.maxSpeed && fish.speed.length >= fish.maxSpeed) {
        return // don't wag tail if we at max speed
    }
    fish.body.addActingForce(vectorForPolar(tailForce, fish.body.orientation))
}


class _MoveAction extends AgentAction {
    constructor(entity, params = {}) {
        super(entity, {
            description: "Generic move",
            tailForce: entity.tailForce,
             ...params
            })
    }

    get targetPosition() {
        throw new Error("Not implemented")
    }

    canBeFinished(model) {
        throw new Error("Not implemented")
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        if (this.finished) {
            return
        }
        _adjustRotation(this.entity,  this.entity.position.vectorTo(this.targetPosition).theta, deltaMs)
        _applyTail(this.entity, this.params.tailForce)
    }
}

export class RotateToPoint extends _MoveAction {
    constructor(entity, point, params) {
        super(entity, {
            description: "Rotating to point",
            distanceTolerance: Math.PI / 8,
            ...params
        })
        this._point = point
    }

    get targetPosition() {
        return this._point
    }

    canBeFinished(model) {
        const targetVect = this.entity.position.vectorTo(this._point)
        const relAngle = relativeAngle(this.entity.body.orientation, targetVect.theta)
        const result = Math.abs(relAngle) < this.params.distanceTolerance
        return result
    }
}


export class MoveToPointAction extends _MoveAction {
    constructor(entity, position, params) {
        super(entity, {
            description: "Moving to point",
            distanceTolerance: 5,
            ...params
        })
        this._position = position
    }

    get targetPosition() {
        return this._position
    }

    canBeFinished(model) {
        const dist = this.entity.position.distanceTo(this.targetPosition)
        return dist <= this.params.distanceTolerance
    }
}

export class FollowEntityAction extends _MoveAction {
    constructor(entity, targetEntity, params) {
        super(entity, {
            description: "Following entity",
            distanceTolerance: 5,
            ...params
        })
        this._target = targetEntity
    }

    get targetPosition() {
        return this._target.position
    }

    canBeFinished(model) {
        const dist = this.entity.position.distanceTo(this.targetPosition)
        return dist <= this.params.distanceTolerance
    }

}

export class FollowEntityTillContactAction extends FollowEntityAction {
    canBeFinished(model) {
        return this._target.boundingBox.overlaps(this.me.boundingBox)
    }
}

export class GainDistanceAction extends _MoveAction {
    constructor(entity, distance = 20, params = {}) {
        super(entity, {
            description: "Gaining distance",
            distanceTolerance: 5,
            ...params
        })
        this.distance = distance
        this._target = null
    }

    get targetPosition() {
        return this._target
    }

    canBeFinished(model) {
        const dist = this.entity.position.distanceTo(this.targetPosition)
        return dist <= this.params.distanceTolerance
    }

    updateState(deltaMs, model) {
        if (!this._target) {
            this._target =  randomPointInSight(this.me, model, this.me.sightRange / 2, this.me.sightRange, Math.PI / 16)
                || randomPointInSight(this.me, model, this.me.sightRange / 2, this.me.sightRange, Math.PI / 8)
                || randomPointInSight(this.me, model, this.me.sightRange / 2, this.me.sightRange, Math.PI / 4)
                || randomPointInSight(this.me, model, this.me.sightRange / 2, this.me.sightRange, Math.PI / 2)
                || randomPointInSight(this.me, model, this.me.sightRange / 2, this.me.sightRange, Math.PI / 1)

            if (!this._target) {
                console.log("Can't find a point to retreat to")
                this.finish()
            }
        }
        super.updateState(deltaMs, model)
    }
}


class StopAction extends AgentAction {
    constructor(entity, params = {}) {
        super(entity, {
            speedLimit: 1,
            description: "Stopping",
            ...params
        })
    }

    get targetPosition() {
        return null
    }

    canBeFinished(model) {
        return this.entity.body.speed.length <= this.params.speedLimit
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        if (!this.canBeFinished(model)) {
            const me = this.entity
            const breakVect = me.body.speed.negative().withLength(me.tailForce)
            me.body.addActingForce(breakVect)
        }
    }
}

class LateralMoveAction extends AgentAction {
    constructor(entity, point, params = {}) {
        super(entity, {
            description: "Lateral move",
            distanceTolerance: 3,
            ...params})
        this.point = point
    }

    get targetPosition() {
        return this.point
    }

    canBeFinished(model) {
        const dist = this.entity.position.distanceTo(this.point)
        return dist <= this.params.distanceTolerance
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        if (this.finished) {
            return
        }
        const me = this.entity
        const force = this.entity.position.vectorTo(this.point).withLength(me.tailForce)
        me.body.addActingForce(force)
    }
}


export class AttackAction extends AgentAction {
    constructor(entity, target, params={}) {
        super(entity, {
            description: "attack",
            ...params
        })
        this.target = target
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        const me = this.entity
        me.attacks.forEach(a => {
            if (a.cooldown <= 0) {
                a.attack(this.target)
            }
        })
        this.finish()
   }
}



export class WaitForReadyAttack extends AgentAction {
    canBeFinished(model) {
        return this.me.attacks.some(w => w.ready)
    }

}

/////////
// PLANS
/////////

export class Plan {
    constructor(name, targetPosition=null, ...actions) {
        this.name = name
        this._actions = actions
        this._idx = 0
        this._targetPosition = targetPosition
    }

    get valid() {
        return this._idx < this._actions.length
    }

    get description() {
        const result = [this.name]
        if (this._idx < this._actions.length) {
            result.push(this._actions[this._idx].description)
        } else {
            result.push(("Finished"))
        }
        return result
    }

    get targetPosition() {
        if (this._targetPosition) {
            return this._targetPosition
        }
        if (this._idx < this._actions.length) {
            return this._actions[this._idx].targetPosition
        } else {
            return null
        }
    }

    updateState(deltaMs, model) {
        while (this._idx < this._actions.length && this._actions[this._idx].finished) {
            this._idx++
        }
        if (this._idx < this._actions.length) {
            this._actions[this._idx].updateState(deltaMs, model)
        }
    }
}

export function planBackOff(entity, target) {
    return new Plan(
        "Backoff",
        target,
        new LateralMoveAction(entity, target),
        )
}

function rotateToPoint(entity, point, map, params) {
    const targetVector = entity.position.vectorTo(point)

    const needed = Math.abs(relativeAngle(
        entity.orientation,
        entity.position.vectorTo(point).theta
    ))

    const veryCloseRadius = entity.radius * 5
    const closeRadius = entity.radius * 10

    const veryClose = targetVector.length < veryCloseRadius
    const close = targetVector.length < closeRadius

    const obstaclesClose = map.detectCollision(
        rectangle(entity.position, new Point(closeRadius, closeRadius)),
        params.mapSize
        ) != null


    // can we do a flyby?
    if (
        (needed < Math.PI / 8) // almost straight ahead
        || (needed < Math.PI / 4 && !close && !obstaclesClose) // in front 90' and not close
    ) {
        // flyby, no actions
        return []
    }

    const result = []

    // do we need a full stop?
    if ((obstaclesClose && (needed > Math.PI / 2)) || veryClose) {
        result.push(new StopAction(entity))
    }

    // if close: do unpowered until almost straight
    if (close || obstaclesClose) {
        result.push(new RotateToPoint(entity, point, {
            tailForce: 0,
            distanceTolerance: Math.PI / 8
        }))
    } else {
        // if not close: do unpowered until front half, then powered
        result.push(new RotateToPoint(entity, point, {
            tailForce: 0,
            distanceTolerance: Math.PI / 2
        }))
        result.push(new RotateToPoint(entity, point, {
            tailForce: entity.tailForce,
            distanceTolerance: Math.PI / 8
        }))

    }
    return result
}


const PLAN_PARAMS = {
    mapSize: 0,
}


export function planStop(entity) {
    return new Plan(
        `Stop`,
        entity.position,
        new StopAction(entity),
    )
}

export function planRotateToPoint(entity, point) {
    return new Plan(
        `Rotate to point`,
        point,
        new RotateToPoint(entity, point, {tailForce: 0}),
    )
}

export function planMoveToPoint(entity, p, map, params) {
    params = {...PLAN_PARAMS, ...params}
    return new Plan(
        `Move`,
        p,
        //...rotateToPoint(entity, p, map, {...params, distanceTolerance: Math.PI / 8}),
        new MoveToPointAction(entity, p, params),
    )
}


export function planFollow(entity, target, map, params) {
    params = {...PLAN_PARAMS, ...params}
    return new Plan(
        `Follow ${target.id}`,
        null,
        new FollowEntityAction(entity, target, params),
    )
}

export function planAttack(entity, target, map, params) {
    params = {...PLAN_PARAMS, ...params}
    return new Plan(
        `Attack ${target.id}`,
        null,
        new WaitForReadyAttack(entity),
        ...rotateToPoint(entity, target.position, map, params),
        new FollowEntityTillContactAction(entity, target),
        new AttackAction(entity, target),
        new GainDistanceAction(entity, 30),
    )
}
