import { entityHit, HasEffects } from "./effects"

export class Entity extends HasEffects {
    constructor(id, body) {
        super()
        this.id = id
        this.body = body
        this.deleted = false
    }

    getPosition() {
        return this.body.position
    }

    get radius() {
        return this.body.volume.radius
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
        this.addEffect(entityHit())
    }

    onCollision(collision) {
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        this.body.updateState(deltaMs, model, c => {this.onCollision(c)})
    }

    distanceTo(entity) {
        return this.position.distanceTo(entity.position) - this.radius - entity.radius
    }
}


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

