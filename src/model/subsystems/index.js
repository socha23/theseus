import { randomElem } from '../../utils'
import { ACTION_CATEGORY, ToggleAction, action } from '../action'
import { Effect, poweringUp, poweringDown, shutdown, EFFECT_CATEGORIES, HasEffects } from '../effects'
import { Point } from '../physics.js'

export const SUBSYSTEM_CATEGORIES = {
    DEFAULT: "DEFAULT",
    WEAPON: "WEAPON",
    STATUS: "STATUS",
    NAVIGATION: "NAVIGATION",
    SONAR: "SONAR",

}

const DEFAULT_TEMPLATE = {
    powerConsumption: 0,
    gridSize: new Point(1, 1),
    takesDamage: true,
    waterResistant: false,
}


class TogglePowerAction extends ToggleAction {
    constructor(subsystem) {
        super({
            id: subsystem.id + "_on",
            name: "Toggle power",
            icon: "fa-solid fa-power-off",
            category: ACTION_CATEGORY.SPECIAL,
            onChange: (val) => {
                subsystem.addEffect(val ? poweringUp() : poweringDown())
            },
        })

        this._subsystem = subsystem
    }

    get longName() {
        return this.value ? "Turn off " : "Turn on "
    }

    addErrorConditions(conditions, model) {
        super.addErrorConditions(conditions, model)
        if (!this._subsystem.on && !this._subsystem.waterResistant && this._subsystem.underWater) {
            conditions.push("Under water")
        } else if (!this._subsystem.on && (model.sub.powerBalance < this._subsystem.nominalPowerConsumption)) {
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
        this._subPowerBalance = 0

        this._actionOn = new TogglePowerAction(this)
        this.actions.push(this._actionOn)

        this.gridPosition = gridPosition
        this.gridSize = this.template.gridSize
        this.underWater = false
    }



    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)

        this.actions.forEach(a => a.updateState(deltaMs, model, actionController))

        this._updateUnderWater(deltaMs, model)
        this._subPowerBalance = model.sub.powerBalance

    }

    _updateUnderWater(deltaMs, model) {
        const myLevel = (model.sub.gridHeight - this.gridPosition.y) -  this.gridSize.y / 2
        this.underWater = myLevel < model.sub.waterLevel
        if (this.on && this.underWater && !this.waterResistant) {
            this.shutdown()
        }

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
            powerConsumption: this.powerConsumption,
            nominalPowerConsumption: this.nominalPowerConsumption,
            subPowerBalance: this._subPowerBalance,


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
        var effectsMultiplier = 1
        this.statusEffects.forEach(e => {
            effectsMultiplier *= (e.powerConsumptionMultiplier || 1)
        })
        return this._powerConsumption * effectsMultiplier
    }

    get powerConsumption() {
        var effectsMultiplier = 1
        this.statusEffects.forEach(e => {
            effectsMultiplier *= (e.powerConsumptionMultiplier || 1)
        })
        return this.on ? this._powerConsumption * effectsMultiplier : 0
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

    get waterResistant() {
        return this.template.waterResistant
    }

    get leak() {
        var res = 0
        this.statusEffects.forEach(e => {
            res += e.leak
        })
        return res
    }

    addLightDamage() {
        const availableDamageTypes = this.getAvailableLightDamageTypes().filter(d => !this.hasEffectOfType(d))
        const damage =  (availableDamageTypes.length > 0)
            ? this.createDamageOfType(randomElem(availableDamageTypes))
            : new SubsystemDamage(this, GENERIC_LIGHT_DAMAGE)

        this.addEffect(damage)
    }

    addHeavyDamage() {
        const availableDamageTypes = this.getAvailableHeavyDamageTypes().filter(d => !this.hasEffectOfType(d))
        const damage =  (availableDamageTypes.length > 0)
            ? this.createDamageOfType(randomElem(availableDamageTypes))
            : new SubsystemDamage(this, GENERIC_HEAVY_DAMAGE)

        this.addEffect(damage)
    }

    getAvailableLightDamageTypes() {
        return []
    }

    getAvailableHeavyDamageTypes() {
        return []
    }

    createDamageOfType(type) {
        throw "Can't create damage"
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

export const GENERIC_LIGHT_DAMAGE = {
    name: "Light damage",
    type: "damageLight",
    repairTime: 1000,
}

export const GENERIC_HEAVY_DAMAGE = {
    name: "Heavy damage",
    type: "damageHeavy",
    repairTime: 5000,
    leak: 0.1,
}


export const DEFAULT_DAMAGE_PARAMS = {
    category: EFFECT_CATEGORIES.DAMAGE,
    type: "damage",
    repairTime: 1000,
    leak: 0,
    powerConsumptionMultiplier: 1,
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

    get powerConsumptionMultiplier() {
        return this.params.powerConsumptionMultiplier
    }

    get type() {
        return this.params.type
    }

    get leak() {
        return this.params.leak || 0
    }

    toViewState() {
        return {
            ...super.toViewState(),
            type: this.type,
            leak: this.leak,
        }
    }
}
