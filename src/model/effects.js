export const EFFECT_TYPES = {
    DEFAULT: "default",
    POWER_UP: "poweringUp",
    POWER_DOWN: "poweringDown",
    SHUTDOWN: "shutdown",
    SHOOT_MISS: "shootMiss",
    SHOOT_HIT: "shootHit",
    ENTITY_HIT: "entityHit",
}

export const EFFECT_CATEGORIES = {
    DEFAULT: "default",
    VISUAL: "visual",
    STATUS: "status",
}


const DEFAULT_EFFECT_PARAMS = {
    type: EFFECT_TYPES.DEFAULT,
    category: EFFECT_CATEGORIES.DEFAULT,
    onCompleted: (m) => {},
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
        return this._params.category
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

    updateState(deltaMs, model) {
    }

    toViewState() {
        return {
            id: this.id,
            type: this.type,
        }
    }

}

class TimedEffect extends Effect {
    constructor(params) {
        super(params)
        this.durationMs = this.params.durationMs
    }

    updateState(deltaMs, model) {
        this.durationMs -= deltaMs
        if (this.durationMs <= 0) {
            this.onCompleted(model)
        }
    }

    toViewState() {
        return {
            ...super.toViewState(),
            durationMs: this.durationMs
        }

    }

}

export class HasEffects {

    constructor() {
        this._effects = []
    }

    updateState(deltaMs, model) {
        this._effects = this._effects.filter(e => e.active)
        this._effects.forEach(e => e.updateState(deltaMs, model))
    }

    addEffect(effect) {
        this._effects.push(effect)
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
