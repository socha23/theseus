import { DRAG_COEFFICIENTS, Vector, } from "./physics"
import { Volume, Point, vectorForPolar } from "./physics"
import { planBackOff, planAttack, planMoveToPoint, AgentEntity } from "./agent"
import { Effect } from "./effects"

const DEFAULT_DAMAGE = {
    strength: 10,
    type: "default",
}
/*
const SAMPLE_ATTACK_DEFINITION = {
    range: 2,
    cooldown: 3000,
    damage: DEFAULT_DAMAGE,
}
*/
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

        this._blood = 1
        this._bleedRate = 0

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

    onDamage(damageParams) {
        this.addEffect(new FishDamage(damageParams))
        if (Math.random() < damageParams.shockChance) {
            this.onDie()
        }
    }

    onHit(damage) {
        super.onHit()
        const effectiveDamage = damage * 1000 / this.mass
        const wounds = effectiveDamage / Math.random()
        if (wounds < 1) {
            this.onDamage(LIGHT_DAMAGE)
        } else if (wounds < 2) {
            this.onDamage(MEDIUM_DAMAGE)
        } else if (wounds < 4) {
            this.onDamage(HEAVY_DAMAGE)
        } else {
            this.onDamage(HEAVY_DAMAGE)
            this.onDamage(HEAVY_DAMAGE)
            this.onDamage(HEAVY_DAMAGE)
        }
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

    onDie() {
        this.alive = false
        this._bleedRate = 0
        this.body.volume.dragCoefficient = DRAG_COEFFICIENTS.DEFAULT

    }

    createNextPlan(model) {
        return this._planCreator(this, model)
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        this._attacks.forEach(a => {a.updateState(deltaMs)})

        if (this.alive) {
            this._bleedRate = this.cumulativeEffect("bleedRate")
            this._blood = Math.max(0, this._blood - (this._bleedRate * deltaMs / 1000))
            if (this._blood <= 0) {
                this.onDie()
            }
        }
    }

    get mouthPoint() {
        return this.position.plus(new Vector(this.length / 2, 0)).rotate(this.orientation, this.position)
    }

    toViewState() {
        return {
            ...super.toViewState(),
            bloodPercent: Math.floor(this._blood * 1000) / 10,
            bleedRate: this._bleedRate,
            alive: this.alive,
            targetPosition: this.targetPosition,
            planDescription: this.planDescription,
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

const DAMAGE_PARAMS = {
    bleedRate: 0.1,
    shockChance: 0.1,
    name: "Generic damage",
    durationMs: 0,
}


function lightDamage() {
    return new FishDamage({
    })
}

const LIGHT_DAMAGE = {
    ...DAMAGE_PARAMS,
    name: "Light damage",
    bleedRate: 0.01,
    shockChance: 0,
    durationMs: 30 * 1000,

}

const MEDIUM_DAMAGE = {
    ...DAMAGE_PARAMS,
    name: "Medium damage",
    bleedRate: 0.02,
    shockChance: 0.1,
    durationMs: 120 * 1000,
}

const HEAVY_DAMAGE = {
    ...DAMAGE_PARAMS,
    name: "Heavy damage",
    bleedRate: 0.05,
    shockChance: 0.2,
}


class FishDamage extends Effect {
    constructor(params) {
        super({...DAMAGE_PARAMS, ...params})
    }

    toViewState() {
        return {
            ...super.toViewState(),
            name: this.params.name,
            description: this.params.description,
        }
    }
}
