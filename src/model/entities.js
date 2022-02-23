import { Vector } from "./physics"
import { FishAgent, MovePlan } from "./agent"

export class Entity {
    constructor(id, body) {
        this.id = id
        this.body = body
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
}

export class AgentEntity extends Entity {
    constructor(id, body, agent) {
        super(id, body)
        this.agent = agent
    }

    updateState(deltaMs, model) {
        super.updateState()
        this.agent.updateState(deltaMs, this, model)
    }
}

export class Fish extends AgentEntity {
    constructor(id, body, template, agent=new FishAgent()) {
        super(id, body, agent)
        this.tailForce = template.tailForce
        this.rotationForce = template.rotationForce
        this.rotationSpeed = template.rotationSpeed
    }



    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
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

            let tailForce = Vector.ZERO


            //            if (Math.abs(rotationAngle) < 1) {
                tailForce = this.body.dorsalThrustVector(this.tailForce)
//            }

            // can't get rotation to work by vectors
            this.body.updateState(deltaMs, tailForce)
            this.body.orientation = this.body.orientation + rotation
        }
    }
}


