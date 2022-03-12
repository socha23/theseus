import { ACTION_CATEGORY, ToggleAction, action } from '../action'
import { Effect, EffectsMixin, poweringUp, poweringDown, shutdown, EFFECT_CATEGORIES, HasEffects } from '../effects'
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
    takesDamage: true,
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

export class Subsystem extends HasEffects {
    constructor(gridPosition, id, name, category, template={}) {
        super()
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
        super.updateState(deltaMs, model, actionController)
        this.actions.forEach(a => a.updateState(deltaMs, model, actionController))
    }

    toViewState() {
        return {
            ...super.toViewState(),
            id: this.id,
            name: this.name,
            category: this.category,
            actions: this.actions.map(a => a.toViewState()),
            actionOn: this._actionOn.toViewState(),
            on: this.on,
            gridPosition: this.gridPosition,
            gridSize: this.gridSize,
            statusEffects: this.statusEffects.map(e => e.toViewState()),

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

    get takesDamage() {
        return this.template.takesDamage
    }

    get statusEffects() {
        return this.effects.filter(e => e.statusEffect)
    }

    addSampleStatus() {
        this.addEffect(new SubsystemDamage(this, {
            name: "Generic damage",
        }))
    }

}


export class StatusEffect extends Effect {
    constructor(params) {
        super(params)
        this.statusEffect = true
        this._actions = []
    }

    toViewState() {
        return {
            ...super.toViewState(),
            name: this.name,
            actions: this._actions.map(a => a.toViewState()),
        }
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs. model, actionController)
        this._actions.forEach(a => {
            a.updateState(deltaMs, model, actionController)
        })
    }

    get name() {
        return this.params.name
    }
}

export const DAMAGE_TYPES = {
    DEFAULT: "damageDefault",
}

export const DEFAULT_DAMAGE_PARAMS = {
    category: EFFECT_CATEGORIES.DAMAGE,
    type: DAMAGE_TYPES.DEFAULT,
    repairTime: 3000,
}


export class SubsystemDamage extends StatusEffect {
    constructor(subsystem, params) {
        super({...DEFAULT_DAMAGE_PARAMS, ...params})
        this.subsystem = subsystem
        this.repairAction = action({
            id: this.id + "_repair",
            name: "Repair",
            longName: "Repair",
            icon: "fa-solid fa-wrench",
            addErrorConditions: c => this._addRepairErrors(c),
            progressTime: this.params.repairTime,
            requiresOperator: true,
            onCompleted: m => {this.onCompleted()},
        });
        this._actions.push(this.repairAction)
    }

    _addRepairErrors(errors) {
        if (this.subsystem.on) {
            errors.push("Must be powered off")
        }
    }


}
