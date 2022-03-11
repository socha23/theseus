import { ACTION_CATEGORY, ToggleAction  } from '../action'
import { EffectsMixin, poweringUp, poweringDown, shutdown } from '../effects'
import { Point } from '../physics.js'

export const SUBSYSTEM_CATEGORIES = {
    WEAPON: "WEAPON",
    STATUS: "STATUS",
    NAVIGATION: "NAVIGATION",
    SONAR: "SONAR",

}

const DEFAULT_TEMPLATE = {
    powerConsumption: 0,
    gridSize: new Point(1, 1),
}


class TogglePowerAction extends ToggleAction {
    constructor(subsystem) {
        super({
            id: subsystem.id + "_on",
            name: "Toggle power",
            icon: "fa-solid fa-power-off",
            category: ACTION_CATEGORY.SPECIAL,
            onChange: (val) => {subsystem.addEffect(val ? poweringUp() : poweringDown())},
        })

        this._subsystem = subsystem
    }

    get longName() {
        return this.value ? "Turn off " : "Turn on "
    }

    addErrorConditions(conditions, model) {
        super.addErrorConditions(conditions, model)
        if (!this._subsystem.on && (model.sub.powerBalance < this._subsystem.nominalPowerConsumption)) {
            conditions.push("Insufficient power")
        }
    }
}



export class Subsystem {
    constructor(gridPosition, id, name, category, template={}) {
        this.template={...DEFAULT_TEMPLATE, ...template}
        this.id = id
        this.name = name
        this.category = category
        this.actions = []
        this._powerConsumption = this.template.powerConsumption

        this._actionOn = new TogglePowerAction(this)
        this.actions.push(this._actionOn)

        this.gridPosition = gridPosition
        this.gridSize = this.template.gridSize

    }



    updateState(deltaMs, model, actionController) {
        this._updateEffects(deltaMs, model)
        this.actions.forEach(a => a.updateState(deltaMs, model, actionController))
    }

    toViewState() {
        return {
            ...this._effectsViewState(),
            id: this.id,
            name: this.name,
            category: this.category,
            actions: this.actions.map(a => a.toViewState()),
            actionOn: this._actionOn.toViewState(),
            on: this.on,
            gridPosition: this.gridPosition,
            gridSize: this.gridSize,

        }
    }

    isEngine() {
        return false
    }

    isTracking() {
        return false
    }

    shutdown() {
        this.on = false
        this.addEffect(shutdown())
    }

    get nominalPowerConsumption() {
        return this._powerConsumption
    }

    get powerConsumption() {
        return this.on ? this._powerConsumption : 0
    }

    get powerGeneration() {
        return 0
    }

    get on() {
        return this._actionOn.value
    }

    set on(value) {
        this._actionOn.value  = value
    }

    get ranges() {
        return []
    }

    get aimLines() {
        return []
    }

}

Object.assign(Subsystem.prototype, EffectsMixin)

