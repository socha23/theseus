import { randomElem } from '../../utils'
import { ToggleAction } from '../action'
import { Effect, poweringUp, poweringDown, shutdown, HasEffects, lightDamage, mediumDamage, heavyDamage } from '../effects'
import { Point } from '../physics.js'
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
        this._statusEffects = this.effects.filter(e => e.statusEffect)
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
            this.shutdown(false)
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

    addRandomDamage(grade=GRADES.LIGHT) {
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
            this._shakeFor(owned.grade)
        } else {
            this.addDamage(grade, params)
        }
    }

    _shakeFor(grade) {
        if (grade == GRADES.LIGHT) {
            this.addEffect(lightDamage())
        } else         if (grade == GRADES.MEDIUM) {
            this.addEffect(mediumDamage())
        } else {
            this.addEffect(heavyDamage())
        }
    }

    addDamage(grade, params) {
        this.addEffect(damage(this, grade, params))
        this._shakeFor(grade)
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
