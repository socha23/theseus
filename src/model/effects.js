export const EFFECT_TYPES = {
    DEFAULT: "default",
    POWER_UP: "poweringUp",
    POWER_DOWN: "poweringDown",
    SHUTDOWN: "shutdown",
    SHOOT_MISS: "shootMiss",
    SHOOT_HIT: "shootHit",
    ENTITY_HIT: "entityHit",
    LIGHT_DAMAGE: "lightDamage",
    MEDIUM_DAMAGE: "mediumDamage",
    HEAVY_DAMAGE: "heavyDamage",
    POWER_FLICKER: "powerFlicker",
}

export const EFFECT_CATEGORIES = {
    DEFAULT: "default",
    VISUAL: "visual",
    STATUS: "status",
    DAMAGE: "damage",
}


const DEFAULT_EFFECT_PARAMS = {
    type: EFFECT_TYPES.DEFAULT,
    category: EFFECT_CATEGORIES.DEFAULT,
    onCompleted: (m) => {},
}

export function shake(size, direction, params = {}) {
    return new TimedEffect({
        type: size + "Shake_" + direction,
        durationMs: 1000,
        ...params
    })
}


export function lightDamage(params = {}) {
    return new TimedEffect({
        type: EFFECT_TYPES.LIGHT_DAMAGE,
        durationMs: 300,
        ...params
    })
}

export function mediumDamage(params = {}) {
    return new TimedEffect({
        type: EFFECT_TYPES.MEDIUM_DAMAGE,
        durationMs: 300,
        ...params
    })
}

export function heavyDamage(params = {}) {
    return new TimedEffect({
        type: EFFECT_TYPES.HEAVY_DAMAGE,
        durationMs: 300,
        ...params
    })
}

export function powerFlicker(params = {}) {
    return new TimedEffect({
        type: EFFECT_TYPES.POWER_FLICKER,
        durationMs: 50,
        ...params
    })
}

export function poweringUp(params = {}) {
    return new TimedEffect({
        type: EFFECT_TYPES.POWER_UP,
        durationMs: 500,
        ...params
    })
}

export function poweringDown(params = {}) {
    return new TimedEffect({
        type: EFFECT_TYPES.POWER_DOWN,
        durationMs: 500,
        ...params
    })
}

export function shutdown(params = {}) {
    return new TimedEffect({
        type: EFFECT_TYPES.SHUTDOWN,
        durationMs: 500,
        ...params
    })
}

export function shootHit(params = {}) {
    return new TimedEffect({
        type: EFFECT_TYPES.SHOOT_HIT,
        durationMs: 500,
        ...params
    })
}

export function shootMiss(params = {}) {
    return new TimedEffect({
        type: EFFECT_TYPES.SHOOT_MISS,
        durationMs: 500,
        ...params
    })
}

export function entityHit(params = {}) {
    return new TimedEffect({
        type: EFFECT_TYPES.ENTITY_HIT,
        durationMs: 500,
        ...params
    })
}

var autoinc = 0

export class Effect {
    constructor(params) {
        this.params = {...DEFAULT_EFFECT_PARAMS, ...params}
        this.id = "effect" + autoinc++
        this._active = true
    }

    get category() {
        return this.params.category
    }

    get active() {
        return this._active
    }

    get type() {
        return this.params.type
    }

    onCompleted(m) {
        this._active = false
        this.params.onCompleted(m)
    }

    updateState(deltaMs, model, actionController) {
    }

    toViewState() {
        return {
            id: this.id,
            type: this.type,
            category: this.category,
        }
    }

}

export class TimedEffect extends Effect {
    constructor(params) {
        super(params)
        this.durationMs = this.params.durationMs
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        this.durationMs -= deltaMs
        if (this.durationMs <= 0) {
            this.onCompleted(model)
        }
    }

    toViewState() {
        const res = super.toViewState()
        res.durationMs = this.durationMs
        return res

    }

}

export class HasEffects {

    constructor() {
        this._effects = []
        this._effectsQueue = []
    }

    updateState(deltaMs, model, actionController) {
        const newE = this._effectsQueue
        this._effectsQueue = []
        this._effects.forEach(e => {
            if (e.active) {
                e.updateState(deltaMs, model, actionController)
                newE.push(e)
            } else {
            }
        })
        this._effects = newE
    }

    addEffect(effect) {
        this._effectsQueue.push(effect)
    }

    get effects() {
        return this._effects
    }

    getEffectsOfCategory(category) {
        return this.effects.filter(e => e.category === category)
    }

    toViewState() {
        return {
            effects: this.effects.map(e => {
                return e.toViewState()
            }),
        }
    }

    hasEffectOfType(type) {
        if (type instanceof Effect) {
            type = type.type
        }
        return this.effects.some(e => e.type === type)
    }
}
