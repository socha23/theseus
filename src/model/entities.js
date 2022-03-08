import { DRAG_COEFFICIENTS, Vector } from "./physics"
import { BackOff, FishAgent, MovePlan } from "./agent"
import { EffectsMixin, EFFECT_TYPES } from "./effects"

export class Entity {
    constructor(id, body) {
        this.id = id
        this.body = body
        this.deleted = false
    }

    getPosition() {
        return this.body.position
    }

    getRadius() {
        return this.body.volume.getRadius()
    }

    updateState(deltaMs, model) {
    }

    getWidth() {
        return this.body.volume.width
    }

    getLength() {
        return this.body.volume.length
    }

    getOrientation() {
        return this.body.orientation
    }

    get speedVector() {
        return this.body.speed
    }

    get mass() {
        return this.body.volume.getMass()
    }

    get lastActingForce() {
        return this.body.lastActingForce
    }

    get targetPosition() {
        return null
    }

    get planDescription() {
        return null
    }

    get position() {
        return this.getPosition()
    }

    get boundingBox() {
        return this.body.boundingBox
    }

    onHit() {
        this.addEffect({type: EFFECT_TYPES.ENTITY_HIT, durationMs: 200})
    }

    onCollision(collision) {
    }

    updateState(deltaMs, model) {
        this._updateEffects(deltaMs, model)
        this.body.updateState(deltaMs, model, c => {this.onCollision(c)})
    }
}

Object.assign(Entity.prototype, EffectsMixin)

export class AgentEntity extends Entity {
    constructor(id, body, agent) {
        super(id, body)
        this.agent = agent
        this.alive = true
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        if (this.alive) {
            this.agent.updateState(deltaMs, this, model)
        }
   }
}

export class Fish extends AgentEntity {
    constructor(id, body, template, agent=new FishAgent()) {
        super(id, body, agent)
        this.tailForce = template.tailForce
        this.rotationForce = template.rotationForce
        this.rotationSpeed = template.rotationSpeed
    }

    get targetPosition() {
        if (this.agent.currentPlan instanceof MovePlan) {
            return this.agent.currentPlan.target
        } else {
            return null
        }
    }

    get planDescription() {
        if (this.agent.currentPlan) {
            return this.agent.currentPlan.description
        } else {
            return null
        }
    }

    onHit() {
        super.onHit()

        this.alive = false
        this.body.volume.dragCoefficient = DRAG_COEFFICIENTS.DEFAULT
    }



    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)

        if (this.alive) {
            const plan = this.agent.currentPlan
            if (plan instanceof MovePlan) {
                const direction = new Vector(
                    plan.target.x - this.body.position.x,
                    plan.target.y - this.body.position.y,
                    )
                const rotationAngle = ((4 * Math.PI + direction.theta() - this.body.orientation) % (2 * Math.PI)) - Math.PI
                const rotationDir = Math.sign(rotationAngle)
                const rotationForce = Math.abs(rotationAngle) / Math.PI * this.rotationSpeed

                const rotation = rotationDir * rotationForce * deltaMs / 1000

                //const rotationForce = Math.sign(rotationAngle) * this.rotationForce * (Math.abs(rotationAngle) / Math.PI)

                const tailForce = this.body.dorsalThrustVector(this.tailForce)

                    // can't get rotation to work by vectors
                this.body.addActingForce(tailForce)
                this.body.addActingRotation(rotationForce)
                this.body.setActingOrientation(this.body.orientation + rotation) // todo HACK
            } else if (plan instanceof BackOff) {
                const force = this.body.dorsalThrustVector(this.tailForce).negative()
                this.body.addActingForce(force)
            }
        }

    }

    onCollision(collision) {
        super.onCollision(collision)
        if (this.alive) {
            if (Math.random() < 0.5) {
                this.agent.currentPlan = new BackOff(this.id + "_backoff", this.position, this.body.radius * 2)
            } else {
                this.agent.currentPlan = null;
            }
        }
    }

}


