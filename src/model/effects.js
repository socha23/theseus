const DEFAULT_EFFECT_DURATION = 500

export const EFFECT_TYPES = {
    POWER_UP: "poweringUp",
    POWER_DOWN: "poweringDown",
    SHUTDOWN: "shutdown",
    SHOOT_MISS: "shootMiss",
    SHOOT_HIT: "shootHit",
}

class Effect {
    constructor(type, durationMs=DEFAULT_EFFECT_DURATION) {
        this.type = type
        this.durationMs = durationMs
        this.active = true
    }

    updateState(deltaMs) {
        this.durationMs -= deltaMs
        if (this.durationMs <= 0) {
            this.active = false
        }
    }
}

export const EffectsMixin = {

    _updateEffects(deltaMs) {
        this._effects = (this._effects || []).filter(e => e.active)
        this._effects.forEach(e => e.updateState(deltaMs))
    },

    addEffect(type, durationMs) {
        if (!this._effects) {
            this._effects = []
        }
        this._effects.push(new Effect(type, durationMs))
    }
}
