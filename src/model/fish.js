import { DRAG_COEFFICIENTS, } from "./physics"
import { Point, vectorForPolar } from "./physics"
import { planBackOff, planFollowEntity, planMoveToPoint, AgentEntity } from "./agent"

export class Fish extends AgentEntity {
    constructor(id, body, template, planCreator=DEFAULT_PLAN_CREATOR) {
        super(id, body)
        this.tailForce = template.tailForce
        this.rotationForce = template.rotationForce
        this.rotationSpeed = template.rotationSpeed
        this._planCreator = planCreator
    }

    get targetPosition() {
        if (this.plan) {
            return this.plan.targetPosition
        } else {
            return null
        }
    }

    get planDescription() {
        if (this.plan) {
            return this.plan.name
        } else {
            return null
        }
    }

    onHit() {
        super.onHit()

        // TODO replace with real damage
        this.alive = false
        this.body.volume.dragCoefficient = DRAG_COEFFICIENTS.DEFAULT
    }

    onCollision(collision) {
        super.onCollision(collision)
        if (this.alive) {
            if (Math.random() < 0.5) {
                this.plan = planBackOff(this)
            } else {
                this.plan = null;
            }
        }
    }

    createNextPlan(model) {
        return this._planCreator(this, model)
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



const DEFAULT_PLAN_CREATOR = (entity, model) => {
    const plan = Math.random()
    if (plan < 0.9) {
        return planMoveToPoint(entity, randomPointInSight(entity.position, model, 50))
    } else {
        return planFollowEntity(entity, model.sub)
    }
}




export function flockPlanCreator(flock) {
    return (entity, model ) => {
        if (Math.random() < 0.1) {
            return planMoveToPoint(entity, randomPointInSight(entity.position, model, 100))
        } else {
            return planMoveToPoint(entity, flock.center)
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

    get center() {
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
