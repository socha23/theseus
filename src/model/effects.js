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

export class Effect {
    constructor(params) {
        this.params = {...DEFAULT_EFFECT_PARAMS, ...params}
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

export const EffectsMixin = {

    _updateEffects(deltaMs, model) {
        this._effects = (this._effects || []).filter(e => e.active)
        this._effects.forEach(e => e.updateState(deltaMs, model))
    },

    addEffect(effect) {
        if (!this._effects) {
            this._effects = []
        }
        this._effects.push(effect)
    },

    getEffects() {
        return this.effects
    },

    get effects() {
        return this._effects || []
    },

    getEffectsOfCategory(category) {
        return this._effects.filter(e => e.category === category)
    },

    _effectsViewState() {
        return {
            effects: (this._effects || []).map(e => {
                return e.toViewState()
            }),
        }
    },

    hasEffectOfType(type) {
        if (type instanceof Effect) {
            type = type.type
        }
        return this._effects.some(e => e.type === type)
    }
}
