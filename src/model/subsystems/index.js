import { randomElem } from '../../utils'
import { ToggleAction, action } from '../action'
import { Effect, poweringUp, poweringDown, shutdown, EFFECT_CATEGORIES, HasEffects, lightDamage, mediumDamage, heavyDamage } from '../effects'
import { Point } from '../physics.js'
import { MATERIALS } from '../materials'
import { damage, GRADES, INCREASED_POWER_CONSUMPTION, LEAK, RANDOM_SHUTDOWN } from './damage'

const DEFAULT_TEMPLATE = {
    powerConsumption: 0,
    gridSize: new Point(1, 1),
    takesDamage: true,
    waterResistant: false,
    viewRefreshMs: 50,
}


class TogglePowerAction extends ToggleAction {
    constructor(subsystem) {
        super({
            id: subsystem.id + "_disable",
            name: "Disable",
            icon: "fa-solid fa-power-off",
            showTooltip: false, // custom tooltip
        })
        this.subsystem = subsystem
    }

    get longName() {
        return this.subsystem.name + (this.value ? " (disabled)" : "")
    }
}

export class Subsystem extends HasEffects {
    constructor(gridPosition, id, name, template={}) {
        super()
        this.template={...DEFAULT_TEMPLATE, ...template}

        this.id = id
        this.name = name
        this.actions = []
        this._powerConsumption = this.template.powerConsumption

        this._actionOn = new TogglePowerAction(this)
        this.actions.push(this._actionOn)

        this.gridPosition = gridPosition
        this.gridSize = this.template.gridSize
        this.underWater = false

        this._statusEffects = []
        this._powerConsumptionMultiplier = 1

        this._powerOnErrors = []
        this._on = false

        this._viewState = this._commonViewState(null)
        this._sinceLastViewRefresh = Math.random() * this.template.viewRefreshMs
    }

    get viewRefreshMs() {
        return this.template.viewRefreshMs
    }

    __updatePowerOnErrors(model) {
        this._powerOnErrors = []
        if (!this.waterResistant && this.underWater) {
            this._powerOnErrors.push("Under water")
        } else if (model.sub.power.balance < this.nominalPowerConsumption) {
            this._powerOnErrors.push("Insufficient power")
        }
        this.statusEffects.forEach(e => {
            e.addPowerErrorConditions(this._powerOnErrors, model)
        })
        this.addStatusPowerErrorConditions(this._powerOnErrors, model)
    }

    addStatusPowerErrorConditions(c, model) {

    }

    get disabled() {
        return this._actionOn.value
    }


    createViewState(model) {

    }

    _commonViewState(model) {
        return {
            id: this.id,
            name: this.name,

            gridPosition: this.gridPosition,
            gridSize: this.gridSize,

            disabled: this.disabled,
            on: this.on,
            actionOn: this._actionOn.toViewState(),
            powerOnErrors: this._powerOnErrors,

            statusEffects: this.statusEffects.map(e => e.toViewState()),

            powerConsumption: this.powerConsumption,
            powerConsumptionMultiplier: this._powerConsumptionMultiplier,
            nominalPowerConsumption: this.nominalPowerConsumption,
            subPowerBalance: model ? Math.floor(model.sub.power.balance) : 0,

            effects: this.effectsViewState(),
        }
    }

    _createViewState(model) {
        return {
            ...this._commonViewState(model),
            ...this.createViewState(model),
        }
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        this.actions.forEach(a => a.updateState(deltaMs, model, actionController))
        if (this.on && this.disabled) {
            this.on = false
        }
        this.__updatePowerOnErrors(model)
        this._statusEffects = this.effects
            .filter(e => e.statusEffect)
            .sort((a, b) =>
                (b.damageCategory * 100 + b.leak)
            - (a.damageCategory * 100 + a.leak))
        this._powerConsumptionMultiplier = this.multiplicativeEffect("powerConsumptionMultiplier")
        this._updateUnderWater(deltaMs, model)

        this._sinceLastViewRefresh += deltaMs
        if (this._sinceLastViewRefresh > this.viewRefreshMs) {
            this._sinceLastViewRefresh %= this.viewRefreshMs
            this._viewState = this._createViewState(model)
        }
    }

    get powerConsumptionMultiplier() {
        return this._powerConsumptionMultiplier
    }


    _updateUnderWater(deltaMs, model) {
        const myLevel = (model.sub.gridHeight - this.gridPosition.y) -  this.gridSize.y / 2
        this.underWater = myLevel < model.sub.waterLevel
        if (this.on && this.underWater && !this.waterResistant) {
            this.shutdown()
        }

    }

    addInterestingMaterialsIds(map) {

    }

    toViewState() {
        return this._viewState
    }

    isEngine() {
        return false
    }

    isTracking() {
        return false
    }

    shutdown(withLock = true) {
        this._on = false
        if (withLock) {
            this._actionOn.value = true
        }
        this.addEffect(shutdown())
    }

    get nominalPowerConsumption() {
        return this._powerConsumption * this._powerConsumptionMultiplier
    }

    get powerConsumption() {
        return this.on ? (this._powerConsumption * this._powerConsumptionMultiplier) : 0
    }

    get powerGeneration() {
        return 0
    }

    get canBeTurnedOn() {
        return this._powerOnErrors.length === 0
    }

    get on() {
        return this._on
    }

    set on(value) {
        if (value && !this._on && this.canBeTurnedOn) {
            this._on = true
            this.addEffect(poweringUp())
        }
        if (!value && this._on) {
            this._on = false
            this.addEffect(poweringDown())
        }
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
        return this._statusEffects
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
        this._addDamage(GRADES.LIGHT)
        this.addEffect(lightDamage())
    }

    addMediumDamage() {
        this._addDamage(GRADES.MEDIUM)
        this.addEffect(mediumDamage())
    }

    addHeavyDamage() {
        this._addDamage(GRADES.HEAVY)
        this.addEffect(heavyDamage())
    }

    _addDamage(grade) {
        const availableTypes = this.getDamageTypes()
            .filter(params => {
                const owned = this.getEffectOfType(params.type)
                return !owned || (owned && !owned.isMaxGrade())
            })

        const params = randomElem(availableTypes)
        if (availableTypes.length == 0) {
            console.log("No more damage available!")
            return
        }
        const owned = this.getEffectOfType(params.type)
        if (owned) {
            owned.upgrade(grade)
        } else {
            this.addEffect(damage(this, grade, params))
        }
    }

    addEffect(effect) {
        super.addEffect(effect)
        if (this.on && effect.shutdown) {
            this.shutdown()
        }
    }

    getDamageTypes() {
        return [
            RANDOM_SHUTDOWN,
            INCREASED_POWER_CONSUMPTION,
            LEAK,
        ]
    }
}


export class StatusEffect extends Effect {
    constructor(params) {
        super(params)
        this.statusEffect = true
        this._actions = []
    }

    toViewState() {
        const res = super.toViewState()
        res.name = this.name
        res.actions = this._actions.map(a => a.toViewState())
        return res
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs.model, actionController)
        this._actions.forEach(a => {
            a.updateState(deltaMs, model, actionController)
        })
    }

    addPowerErrorConditions(c, model) {
        if (this.shutdown) {
            c.push(this.name)
        }
    }

    get shutdown() {
        return this.params.shutdown
    }

    get name() {
        return this.params.name
    }
}

///////////////////
// TO CUT AFTER FINISHING DAMAGE REFAC

export const DAMAGE_CATEGORY = {
    LIGHT: 1,
    MEDIUM: 2,
    HEAVY: 3
}

export const GENERIC_LIGHT_DAMAGE = {
    damageCategory: DAMAGE_CATEGORY.LIGHT,
    name: "Light damage",
    description: "Generic light damage",
    type: "damageLight",
    repairTime: 1000,
    requiredMaterials: {
        [MATERIALS.SPARE_PARTS]: 1,
    }
}

export const GENERIC_MEDIUM_DAMAGE = {
    damageCategory: DAMAGE_CATEGORY.MEDIUM,
    name: "Medium damage",
    description: "Generic medium damage",
    type: "damageMedium",
    repairTime: 3000,
    leak: 0.02,
    requiredMaterials: {
        [MATERIALS.SPARE_PARTS]: 2,
    }
}

export const GENERIC_HEAVY_DAMAGE = {
    damageCategory: DAMAGE_CATEGORY.HEAVY,
    name: "Heavy damage",
    description: "Generic heavy damage",
    type: "damageHeavy",
    repairTime: 5000,
    leak: 0.1,
    requiredMaterials: {
        [MATERIALS.LEAK_SEALS]: 1,
    }
}


export const DEFAULT_DAMAGE_PARAMS = {
    category: EFFECT_CATEGORIES.DAMAGE,
    description: "Damage",
    damageCategory: DAMAGE_CATEGORY.MEDIUM,
    type: "damage",
    repairTime: 1000,
    leak: 0,
    powerConsumptionMultiplier: 1,
    requiredMaterials: {},
    shutdown: false,
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
            progressTime: this.params.repairTime,
            requiresOperator: true,
            onEnterActive: m => {this.subsystem.on = false},
            onCompleted: m => {this.onCompleted()},
            requiredMaterials: this.params.requiredMaterials,
        });
        this._actions.push(this.repairAction)
        this.materialsMissing = false
    }

    addPowerErrorConditions(c, model) {
        super.addPowerErrorConditions(c, model)
        if (this.repairAction.active) {
            c.push("Under repair")
        }
    }

    get damageCategory() {
        return this.params.damageCategory
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

    get description() {
        return this.params.description
    }

    toViewState() {
        return {
            ...super.toViewState(),
            type: this.type,
            leak: this.leak,
            description: this.description,
            damageCategory: this.damageCategory,
        }
    }
}
