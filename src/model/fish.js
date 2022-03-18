import { DRAG_COEFFICIENTS, Vector, } from "./physics"
import { Volume, Point, vectorForPolar } from "./physics"
import { planBackOff, planAttack, planMoveToPoint, AgentEntity } from "./agent"

const DEFAULT_DAMAGE = {
    strength: 10,
    type: "default",
}

const SAMPLE_ATTACK_DEFINITION = {
    range: 2,
    cooldown: 3000,
    damage: DEFAULT_DAMAGE,
}

const DEFAULT_FISH_TEMPALTE = {
    volume: new Volume(2, 2, 4, 0.2),
    tailForce: 20 * 1000,
    rotationalForce: 1 * 1000,
    rotationSpeed: 1,
    aggresive: false,
    sightRange: 50,
    attacks: [],
    color: "red",
}

export class Fish extends AgentEntity {
    constructor(id, body, template, planCreator=DEFAULT_PLAN_CREATOR) {
        super(id, body)
        this.template = {...DEFAULT_FISH_TEMPALTE, ...template}
        this.tailForce = template.tailForce
        this.rotationForce = template.rotationForce
        this.rotationSpeed = template.rotationSpeed
        this._planCreator = planCreator

        this._attacks = this.template.attacks.map(a =>
            new FishAttack(this, a.range, a.cooldown, a.damage)
        )
    }

    get targetPosition() {
        if (this.plan) {
            return this.plan.targetPosition
        } else {
            return null
        }
    }

    get color() {
        return this.template.color
    }

    get attacks() {
        return this._attacks
    }

    get planDescription() {
        if (this.plan) {
            return this.plan.name
        } else {
            return null
        }
    }

    get aggresive() {
        return this.template.aggresive
    }

    get sightRange() {
        return this.template.sightRange
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
                this.plan = planBackOff(this, collision.wallNormal.theta)
            } else {
                this.plan = null;
            }
        }
    }

    createNextPlan(model) {
        return this._planCreator(this, model)
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        this._attacks.forEach(a => {a.updateState(deltaMs)})
    }

    get mouthPoint() {
        return this.position.plus(new Vector(this.length / 2, 0)).rotate(this.orientation, this.position)
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
    if (entity.aggresive && entity.distanceTo(model.sub) <= entity.sightRange) {
        return planAttack(entity, model.sub)
    }
    return planMoveToPoint(entity, randomPointInSight(entity.position, model, 50))
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
            x += e.position.x
            y += e.position.y
            count++
        })
        return new Point(x / count, y / count)
    }
}


class FishAttack {
    constructor(entity, range, cooldownMs=1000, damage=DEFAULT_DAMAGE) {
        this._entity = entity
        this._range = range
        this._cooldownMax = cooldownMs
        this._damage = damage

        this._cooldown = 0
    }

    get range() {
        return this._range
    }

    get cooldown() {
        return this._cooldown
    }

    canAttack(target) {
        return (this.ready)
            && this._entity.position.distanceTo(target.position) <= this._range
    }

    attack(target) {
        target.onHit({
            position: this._entity.mouthPoint,
            damage: this._damage,
        })
        this._cooldown = this._cooldownMax
    }

    updateState(deltaMs) {
        this._cooldown -= deltaMs
    }

    get ready() {
        return this._cooldown <= 0
    }



}

