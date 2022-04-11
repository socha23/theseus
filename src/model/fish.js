import { DRAG_COEFFICIENTS, Vector, } from "./physics"
import { Volume } from "./physics"
import { Effect } from "./effects"
import { fishAI } from "./fishAi"
import { Entity } from "./entities"
import { physicsProfile } from "./physicsLab"
import { toHaveStyle } from "@testing-library/jest-dom/dist/matchers"
import { paramValue, randomElem } from "../utils"

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
    sightRange: 30,
    attacks: [],
    color: "red",
    territoryRange: 0,
    defaultSubFear: 0,
    ac: 10,
    painLevel: 1,
}

export class Fish extends Entity {
    constructor(id, body, template, aiCreator=fishAI) {
        super(id, body)
        this.template = {...DEFAULT_FISH_TEMPALTE, ...template}
        this._tailForce = template.tailForce
        this.rotationForce = template.rotationForce
        this.rotationSpeed = template.rotationSpeed
        this._ai = aiCreator(this)

        this.alive = true
        this._blood = 1
        this._bleedRate = 0

        this._maxSpeed = this.params.maxSpeed

        this._attacks = this.template.attacks.map(a =>
            new FishAttack(this, a.range, a.cooldown, a.damage)
        )
    }

    init(model) {
        this._ai.init(model)
    }


    get species() {
        return this.template.id
    }

    get color() {
        return this.template.color
    }

    get attacks() {
        return this._attacks
    }

    get aggresive() {
        return this.template.aggresive
    }

    get sightRange() {
        return this.template.sightRange
    }

    get subFear() {
        return this._ai.subFear
    }

    get ac() {
        return this.template.ac
    }


    get params() {
        return this.template
    }

    get maxSpeed() {
        return this._maxSpeed
    }

    addBehavior(behavior) {
        this._ai.addBehavior(behavior)
    }

    param(name, defValue=null) {
        return this.template[name] ?? defValue
    }

    onDamage(damageParams) {
        this.addEffect(new FishDamage(damageParams))
        if (Math.random() < damageParams.shockChance) {
            this.onDie()
        }
    }

    onHit(hit) {
        super.onHit(hit)

        const effectiveDamage = hit.strength / this.ac

        // consider:
        // low-caliber, damage 10
        // high-caliber, damage 25

        // little fish, ac 5 - l: high, h: overwhelming
        // med fish, ac 10 - l: normal, h: high
        // big fish, ac 25 - l: low, h: normal
        // ginormous fish, ac 50 - l: not effective, h: normal

        const damageClasses = [
            TRIVIAL_DAMAGE,
            LIGHT_DAMAGE,
            MEDIUM_DAMAGE,
            HEAVY_DAMAGE,
            CATASTROPHIC_DAMAGE
        ]

        var classIdx = 0
        if (effectiveDamage < 1/4) {
            // below 1/4: not effective
            classIdx = 0
        } else if (effectiveDamage < 1/2) {
            classIdx = 1
        } else if (effectiveDamage < 2) {
            classIdx = 2
        } else if (effectiveDamage < 4) {
            classIdx = 3
        } else {
            classIdx = 4
        }

        // some chance of going class higher or lower
        const r = Math.random()
        if (r < 0.2) {
            classIdx = Math.max(0, classIdx - 1)
        }
        if (r > 0.8) {
            classIdx = Math.min(damageClasses.length - 1, classIdx + 1)
        }

        const dam = randomElem(damageClasses[classIdx])
        this.onDamage(dam)
    }

    onHearGunshot() {
        this.addEffect(new Effect({
            type: "fearOfGunshot",
            durationMs: 2 * 1000,
            fearOfSub: 5,
        }))
    }

    onCollision(collision) {
        super.onCollision(collision)
    }

    onDie() {
        this.alive = false
        this._bleedRate = 0
        this.body.volume.dragCoefficient = DRAG_COEFFICIENTS.DEFAULT

    }

    updateState(deltaMs, model) {
        this._ai.updateState(deltaMs, model)
        super.updateState(deltaMs, model)
        this._attacks.forEach(a => {a.updateState(deltaMs)})

        if (this.alive) {
            this._pain = this.cumulativeEffect("pain")
            this._tailForce = this.template.tailForce * this.multiplicativeEffect("tailForce")
            this._maxSpeed = this.template.maxSpeed * this.multiplicativeEffect("maxSpeed")

            this._bleedRate = this.cumulativeEffect("bleedRate")
            this._blood = Math.max(0, this._blood - (this._bleedRate * deltaMs / 1000))
            if (this._blood <= 0) {
                this.onDie()
            }
        }
    }

    get tailForce() {
        return this._tailForce
    }

    get mouthPoint() {
        return this.position.plus(new Vector(this.length / 2, 0)).rotate(this.orientation, this.position)
    }

    toViewState() {
        const v = super.toViewState()
        v.bloodPercent = Math.floor(this._blood * 1000) / 10
        v.bleedRate = this._bleedRate
        v.alive = this.alive
        v.targetPosition = this._ai.targetPosition
        v.planDescription = this._ai.planDescription
        v.isFish = true
        return v
    }

    get pain() {
        return this._pain * this.template.painLevel
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
            damage: {...this._damage, strength: paramValue(this._damage.strength)},
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

const DAMAGE_TYPES = {
   TRIVIAL: "trivial",
   LIGHT: "light",
   MEDIUM: "medium",
   HEAVY: "heavy",
   OVERWHELMING: "overwhelming",
}

// trivial damage doesn't really do anything
const TRIVIAL_DAMAGE = [{
    ...DAMAGE_PARAMS,
    name: "Trivial damage",
    type: DAMAGE_TYPES.TRIVIAL,
    bleedRate: 0.005,
    shockChance: 0,
    durationMs: 5 * 1000,
    pain: 0,
}]


// light damage is mostly harmless. When it accumulates it may be a problem for a fish.
const LIGHT_DAMAGE = [
    {
        name: "Painful stab",
        type: DAMAGE_TYPES.LIGHT,
        bleedTotal: 0.02,
        bleedDurationS: 5,
        shockChance: 0,
        durationS: 5,
        pain: 20,
        painDurationS: 1,
        tailForce: 0.95,
    },
    {
        name: "Grazed skin",
        type: DAMAGE_TYPES.LIGHT,
        bleedTotal: 0.02,
        bleedDurationS: 5,
        shockChance: 0,
        durationS: 10,
        painDurationS: 5,
        pain: 10,
        tailForce: 0.95,
    },
    {
        name: "Lanced appendage",
        type: DAMAGE_TYPES.LIGHT,
        bleedTotal: 0.02,
        bleedDurationS: 5,
        shockChance: 0,
        durationS: 10,
        painDurationS: 3,
        pain: 15,
        tailForce: 0.95,
        maxSpeed: 0.95,
    },
    {
        name: "Injured tail",
        type: DAMAGE_TYPES.LIGHT,
        bleedTotal: 0.02,
        bleedDurationS: 5,
        shockChance: 0,
        durationS: 180,
        pain: 10,
        painDurationS: 10,
        tailForce: 0.9,
        maxSpeed: 0.9,
    },
    {
        name: "Pierced fin",
        type: DAMAGE_TYPES.LIGHT,
        bleedTotal: 0.02,
        bleedDurationS: 5,
        shockChance: 0,
        durationS: 180,
        pain: 10,
        painDurationS: 10,
        tailForce: 0.9,
        maxSpeed: 0.9,
    },

]

// medium damage is an issue. Fish is able to fight, but should be able to take like two before retreating, and three before dying.
const MEDIUM_DAMAGE = [
    {
        name: "Right in the eye",
        type: DAMAGE_TYPES.MEDIUM,
        durationS: 5,
        bleedTotal: 0.1,
        bleedDurationS: 5,
        shockChance: 0.2,
        pain: 80,
        painDurationS: 5,
    },
    {
        name: "Where it hurts",
        type: DAMAGE_TYPES.MEDIUM,
        durationS: 5,
        bleedTotal: 0.1,
        bleedDurationS: 5,
        shockChance: 0.2,
        pain: 80,
        painDurationS: 5,
    },
    {
        name: "Pierced body",
        type: DAMAGE_TYPES.MEDIUM,
        durationS: 5,
        bleedTotal: 0.3,
        bleedDurationS: 5,
        shockChance: 0.2,
        pain: 20,
        painDurationS: 5,
        tailForce: 0.8,
        maxSpeed: 0.8,
    },
    {
        name: "Perforated body",
        type: DAMAGE_TYPES.MEDIUM,
        durationS: 5,
        bleedTotal: 0.3,
        bleedDurationS: 5,
        shockChance: 0.2,
        pain: 20,
        painDurationS: 5,
        tailForce: 0.8,
        maxSpeed: 0.8,
    },
    {
        name: "Damaged tail",
        type: DAMAGE_TYPES.MEDIUM,
        bleedTotal: 0.25,
        bleedDurationS: 5,
        shockChance: 0.2,
        durationS: 300,
        pain: 20,
        painDurationS: 60,
        tailForce: 0.5,
        maxSpeed: 0.5,
    },
    {
        name: "Mangled fin",
        type: DAMAGE_TYPES.MEDIUM,
        bleedTotal: 0.25,
        bleedDurationS: 5,
        shockChance: 0.2,
        durationS: 300,
        pain: 20,
        painDurationS: 60,
        tailForce: 0.5,
        maxSpeed: 0.5,
    },
]

// fish is in trouble now! one heavy damage should render it almost inoperable, two should be almost a cerain death
const HEAVY_DAMAGE = [
    {
        name: "Perforated organs",
        type: DAMAGE_TYPES.HEAVY,
        bleedTotal: 0.4,
        bleedDurationS: 2,
        shockChance: 0.5,
        durationS: 300,
        pain: 50,
        tailForce: 0.5,
        maxSpeed: 0.5,
    },
    {
        name: "Devastated tail",
        type: DAMAGE_TYPES.HEAVY,
        bleedTotal: 0.4,
        bleedDurationS: 2,
        shockChance: 0.5,
        durationS: 300,
        pain: 50,
        tailForce: 0.2,
        maxSpeed: 0.2,
    },
]

const CATASTROPHIC_DAMAGE = [
    {
        name: "Devastated",
        type: DAMAGE_TYPES.OVERWHELMING,
        bleedTotal: 1,
        bleedDurationS: 3,
        shockChance: 0.7,
        pain: 80,
    },
]


class FishDamage extends Effect {
    constructor(params) {
        super({...DAMAGE_PARAMS, ...params})
        this._timeSinceStart = 0

        if (this.params.durationS) {
            this.params.durationMs = paramValue(this.params.durationS) * 1000
        }

        if (this.params.bleedTotal) {
            const bleedTotal = paramValue(this.params.bleedTotal)
            const bleedTimeS = paramValue(this.params.bleedDurationS, paramValue(this.params.durationMs, 1000))
            const bleedRate = bleedTotal / bleedTimeS
            this.params.bleedRate = bleedRate
        }

    }

    toViewState() {
        return {
            ...super.toViewState(),
            name: this.params.name,
            description: this.params.description,
            visible: true,
        }
    }

    updateState(deltaMs, model, ac) {
        super.updateState(deltaMs, model, ac)

        // pain and blood can be only temporary
        this._timeSinceStart += deltaMs

        const painDuration = paramValue(this.params.painDurationS, 0) * 1000
        if (painDuration > 0 && this._timeSinceStart >= painDuration) {
            this.params.pain = 0
        }


        const bloodDuration = paramValue(this.params.bleedDurationS, 0) * 1000
        if (bloodDuration > 0 && this._timeSinceStart >= bloodDuration) {
            this.params.bleedRate = 0
        }
    }
}
