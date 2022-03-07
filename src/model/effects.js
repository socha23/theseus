export const EFFECT_TYPES = {
    DEFAULT: "default",
    POWER_UP: "poweringUp",
    POWER_DOWN: "poweringDown",
    SHUTDOWN: "shutdown",
    SHOOT_MISS: "shootMiss",
    SHOOT_HIT: "shootHit",
    ENTITY_HIT: "entityHit",
}

const DEFAULT_EFFECT_PARAMS = {
    type: EFFECT_TYPES.DEFAULT,
    durationMs: 500,
    onCompleted: (m) => {},
}

class Effect {
    constructor(params) {
        this.params = {...DEFAULT_EFFECT_PARAMS, ...params}
        this.durationMs = this.params.durationMs
        this.active = true
    }

    get type() {
        return this.params.type
    }

    updateState(deltaMs, model) {
        this.durationMs -= deltaMs
        if (this.durationMs <= 0) {
            this.active = false
        }
    }
}


export const EffectsMixin = {

    _updateEffects(deltaMs, model) {
        this._effects = (this._effects || []).filter(e => e.active)
        this._effects.forEach(e => e.updateState(deltaMs, model))
    },

    addEffect(params) {
        if (!this._effects) {
            this._effects = []
        }
        this._effects.push(new Effect(params))
    },
    getEffects() {
        return this._effects || []
    }
}
