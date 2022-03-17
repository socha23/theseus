import { DRAG_COEFFICIENTS, Vector } from "./physics"
import { Point, vectorForPolar } from "./physics"
import { Agent, MoveAround, Follow, MoveTo, BackOff, MovePlan, randomPointAround } from "./agent"
import { AgentEntity } from "./entities"





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

                const speedVal = this.body.speed.length()
                const rotLimit = Math.min(1, 1 / speedVal)

                const rotation = rotationDir * rotationForce * deltaMs / 1000 * rotLimit

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
                this.agent.currentPlan = new BackOff(this.position, this.body.radius * 2)
            } else {
                this.agent.currentPlan = null;
            }
        }
    }

}


function randomPointInSight(position, model, sightRange) {
    for (var i = 0; i < 100; i++) {
        const theta = Math.random() * 2 * Math.PI
        const dist = Math.random() * sightRange
        const posToCheck = position.plus(vectorForPolar(dist, theta))
        if (model.map.raycast(position, posToCheck) == null) {
            return posToCheck
        }
    }
    throw new Error("can't find point in sight")
}


export class FishAgent extends Agent {
    _nextPlan(entity, model) {
        const plan = Math.random()
        if (plan < 0.5) {
            return new MoveTo(randomPointInSight(entity.position, model, 50), 3)
        } else {
            return new Follow(entity, model.sub, 20)
        }
    }
}

export class MoveToFlockCenter extends MoveTo {
    constructor(entity, flock) {
        super(
            randomPointAround(flock.getCenter(), 7),
            5)
        this.description = `Move to flock center`

    }
}


export class FlockAgent extends FishAgent {
    constructor(flock) {
        super()
        this.flock = flock
    }

    _nextPlan(entity, model) {
        if (Math.random() < 0.1) {
            return new MoveAround(entity, 100)
        } else {
            return new MoveToFlockCenter(entity, this.flock)
        }
    }
}

export class Flock {
    constructor() {
        this.entities = []
    }

    addEntity(entity) {
        this.entities.push(entity)
    }

    getCenter() {
        let x = 0
        let y = 0
        let count = 0
        this.entities.forEach(e => {
            x += e.getPosition().x
            y += e.getPosition().y
            count++
        })
        return new Point(x / count, y / count)
    }
}
