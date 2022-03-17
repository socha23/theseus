import { Entity } from "./entities"

export class AgentEntity extends Entity {
    constructor(id, body) {
        super(id, body)
        this._plan = null
        this.alive = true
    }

    get plan() {
        return this._plan
    }

    set plan(val) {
        this._plan = val
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        if (this.alive) {
            if (!this._plan) {
                this._plan = this.createNextPlan(model)
            }
            this._plan.updateState(deltaMs, model)
            if (!this._plan.valid) {
                this._plan = null
            }
        }
    }

    createNextPlan(model) {
        throw new Error("Not implemented")
    }
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

function deltaRotation(from, to) {
    return ((4 * Math.PI + to - from) % (2 * Math.PI)) - Math.PI
}

function rotateTo(fish, point, deltaMs) {
    const direction = fish.position.vectorTo(point)
    // rotate towards target
    const rotation =
        Math.sign(deltaRotation(fish.orientation, direction.theta))
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
        super(entity, {speedLimit: 0.3, ...params})
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
        return deltaRotation(me.orientation, me.position.vectorTo(this._point).theta)
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

        const force = me.body.dorsalThrustVector(me.tailForce).negative()
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

export function planBackOff(entity) {
    return new Plan(
        "Backoff",
        new BackOffAction(entity),
    )
}

function stopAndRotate(entity, point) {
    const needed = Math.abs(deltaRotation(
        entity.orientation,
        entity.position.vectorTo(point).theta
    ))

    if (needed < Math.PI / 4) {
        // 90' cone, no additional actions
        return []
    } else if (needed < Math.PI / 2) {
        // 180' cone, stop before continuing
        return [new StopAction(entity)]
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
