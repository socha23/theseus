import { relativeAngle, transpose } from "../utils"
import { Entity } from "./entities"
import { vectorForPolar } from "./physics"

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
        this.params = params
        this._done = false
        this._entity = entity
    }

    get me() {
        return this._entity
    }

    get finished() {
        return this._done
    }

    get targetPosition() {
        return null
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

function rotateTo(fish, point, deltaMs) {
    const direction = fish.position.vectorTo(point)
    // rotate towards target
    const rotation =
        Math.sign(relativeAngle(fish.orientation, direction.theta))
        * fish.rotationSpeed
        * deltaMs / 1000
    fish.body.setActingOrientation(fish.orientation + rotation)
}

class _MoveAction extends AgentAction {
    constructor(entity, params = {}) {
        super(entity, {distanceTolerance: 5, ...params})
    }

    get targetPosition() {
        throw new Error("Not implemented")
    }

    canBeFinished(model) {
        const dist = this._entity.position.distanceTo(this.targetPosition)
        return dist <= this.params.distanceTolerance
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        if (this.finished) {
            return
        }

        const me = this._entity

        rotateTo(me, this.targetPosition, deltaMs)

        // swim at full speed
        const tail = me.body.dorsalThrustVector(me.tailForce)
        me.body.addActingForce(tail)
    }
}

class StopAction extends AgentAction {
    constructor(entity, params = {}) {
        super(entity, {speedLimit: 1, ...params})
    }

    get targetPosition() {
        return null
    }

    canBeFinished(model) {
        return this._entity.body.speed.length <= this.params.speedLimit
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        if (!this.canBeFinished(model)) {
            const me = this._entity
            const breakVect = me.body.speed.negative().withLength(me.tailForce)
            me.body.addActingForce(breakVect)
        }
    }
}

class RotateToAction extends AgentAction {
    constructor(entity, point, params = {}) {
        super(entity, {distance: Math.PI / 4, ...params})
        this._point = point
    }

    get targetPosition() {
        return this._point
    }

    _neededRotation() {
        const me = this._entity
        return relativeAngle(me.orientation, me.position.vectorTo(this._point).theta)
    }

    canBeFinished(model) {
        return Math.abs(this._neededRotation()) <= this.params.distance
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        if (!this.canBeFinished(model)) {
            rotateTo(this._entity, this.targetPosition, deltaMs)
        }
    }
}



class BackOffAction extends AgentAction {
    constructor(entity, params = {}) {
        super(entity, {distance: 10, ...params})
        this._from = entity.position
    }

    canBeFinished(model) {
        const dist = this._entity.position.distanceTo(this._from)
        return dist >= this.params.distance
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        if (this.finished) {
            return
        }

        const me = this._entity

        const dir = this.params.direction ?? (me.body.orientation + Math.PI)

        const force = vectorForPolar(me.tailForce, dir)
        me.body.addActingForce(force)
    }
}



export class MoveToPointAction extends _MoveAction {
    constructor(entity, position, params) {
        super(entity, params)
        this._position = position
    }

    get targetPosition() {
        return this._position
    }
}

export class FollowEntityAction extends _MoveAction {
    constructor(entity, targetEntity, params) {
        super(entity, params)
        this._target = targetEntity
    }

    get targetPosition() {
        return this._target.position
    }
}


export class FollowEntityTillContactAction extends FollowEntityAction {
    canBeFinished(model) {
        return this._target.boundingBox.overlaps(this.me.boundingBox)
    }
}

export class GainDistanceAction extends _MoveAction {
    constructor(entity, distance = 20, params = {}) {
        super(entity, params)
        this.distance = distance
        this._target = null
    }

    get targetPosition() {
        return this._target
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


export class AttackAction extends AgentAction {
    constructor(entity, target, params={}) {
        super(entity, params)
        this.target = target
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        const me = this._entity
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
    constructor(name, ...actions) {
        this.name = name
        this._actions = actions
        this._idx = 0
    }

    get valid() {
        return this._idx < this._actions.length
    }

    get targetPosition() {
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

export function planBackOff(entity, direction = null) {
    return new Plan(
        "Backoff",
        new BackOffAction(entity, {distance: entity.radius, direction: direction}),
    )
}

function stopAndRotate(entity, point) {
    const needed = Math.abs(relativeAngle(
        entity.orientation,
        entity.position.vectorTo(point).theta
    ))

    if (needed < Math.PI / 4) {
        // 90' cone, no additional actions
        return []
    } else if (needed < Math.PI / 2) {
        // 180' cone, stop before continuing
        return []// [new StopAction(entity)]
    } else {
        // target in the back, stop and rotate
        return [new StopAction(entity), new RotateToAction(entity, point)]
    }
}

export function planMoveToPoint(entity, p) {
    return new Plan(
        `Move to ${p.x.toFixed(1)}, ${p.y.toFixed(1)}`,
        ...stopAndRotate(entity, p),
        new MoveToPointAction(entity, p),
    )
}

export function planFollowEntity(entity, target) {
    return new Plan(
        `Follow ${target.id}`,
        ...stopAndRotate(entity, target.position),
        new FollowEntityAction(entity, target),
    )
}

export function planAttack(entity, target) {
    return new Plan(
        `Attack ${target.id}`,
        new WaitForReadyAttack(entity),
        ...stopAndRotate(entity, target.position),
        new FollowEntityTillContactAction(entity, target),
        new AttackAction(entity, target),
        new GainDistanceAction(entity, 30),
    )
}
