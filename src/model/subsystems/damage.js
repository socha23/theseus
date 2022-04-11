import { SubsystemDamage } from '.'
import { randomEventOccured } from '../../utils'
import { powerFlicker } from '../effects'
import { MATERIALS } from '../materials'
import { Effect, EFFECT_CATEGORIES } from '../effects'
import { action } from '../action'
import { toHaveDisplayValue } from '@testing-library/jest-dom/dist/matchers'

export const GRADES = {
    LIGHT: 1,
    MEDIUM: 2,
    HEAVY: 3
}

export const DEFAULT_DAMAGE_PARAMS = {
    category: EFFECT_CATEGORIES.DAMAGE,
    name: "Damage",
    type: "damage",
    description: "Damage",
    repairTime: 1000,
    leak: 0,
    powerConsumptionMultiplier: 1,
    requiredMaterials: {},
    shutdown: false,
    onUpdateState: null,//(effect, deltaMs, model) => {}
    grades: {
        [GRADES.LIGHT]: {
        },
        [GRADES.MEDIUM]: {
        },
        [GRADES.HEAVY]: {
        },
    },
}

export function damage(subsystem, grade, params) {
    return new GradedSubsystemDamage(subsystem, grade, params)
}

const VIEW_STATE_UPDATE_MS = 1000

export class GradedSubsystemDamage extends Effect {
    constructor(subsystem, grade, params) {
        super({...DEFAULT_DAMAGE_PARAMS, ...params})
        this.subsystem = subsystem
        this.grade = grade
        this.repairAction = this._createRepairAction()

        this._viewState = this._createViewState()
        this._sinceLastStateUpdate = Math.random() * VIEW_STATE_UPDATE_MS
    }

    upgrade(grades) {
        if (this.grade != GRADES.HEAVY) {
            this.grade = Math.min(GRADES.HEAVY, this.grade + grades)
            this.repairAction = this._createRepairAction()
        }
    }


    param(name, defVal = null) {
        return this._curGradeParams()[name] ?? this.params[name] ?? defVal
    }

    _curGradeParams() {
        return this.params.grades[this.grade]
    }

    get statusEffect() {
        return true
    }

    get shutdown() {
        return this.param("shutdown", false)
    }

    get name() {
        return this.param("name", "Damage")
    }

    isMaxGrade() {
        return this.grade === GRADES.HEAVY
    }

    _createRepairAction() {
        return action({
            id: this.id + "_repair",
            name: "Repair",
            longName: "Repair",
            icon: "fa-solid fa-wrench",
            progressTime: this.param("repairTime"),
            requiresOperator: true,
            onEnterActive: m => {this.subsystem.on = false},
            onCompleted: m => {this.onCompleted()},
            requiredMaterials: this.param("requiredMaterials"),
        })
    }

    addPowerErrorConditions(c, model) {
        if (this.shutdown) {
            c.push(this.name)
        }
        if (this.repairAction.active) {
            c.push("Under repair")
        }
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        this.repairAction.updateState(deltaMs, model, actionController)
        if (this.param("onUpdateState")) {
            this.param("onUpdateState")(this, deltaMs, model)
        }
        this._sinceLastStateUpdate += deltaMs
        if (this._sinceLastStateUpdate > VIEW_STATE_UPDATE_MS || (this.repairAction.active)) {
            this._viewState = this._createViewState()
            this._sinceLastStateUpdate = 0
        }
    }

    _createViewState() {
        return {
            ...super.toViewState(),
            icon: this.param("icon"),
            grade: this.grade,
            type: this.type,
            name: this.name,
            leak: this.leak,
            description: this.description,
            actions: [this.repairAction.toViewState()],
            damageCategory: this.damageCategory,
        }
    }

    get powerConsumptionMultiplier() {
        return this.param("powerConsumptionMultiplier")
    }

    get damageCategory() {
        return this.grade
    }

    get type() {
        return this.param("type")
    }

    get leak() {
        return this.param("leak", 0)
    }

    get description() {
        return this.param("description")
    }

    toViewState() {
        return this._viewState
    }
}

export const LEAK = {
    type: "damageLeak",
    icon: "fa-solid fa-droplet",
    repairTime: 5000,
    requiredMaterials: {
        [MATERIALS.LEAK_SEALS]: 1,
    },
    grades: {
        [GRADES.LIGHT]: {
            name: "Small leak",
            description: "Slowly leaks water",
            leak: 0.01,
        },
        [GRADES.MEDIUM]: {
            name: "Leak",
            description: "Leaks water",
            leak: 0.025,
        },
        [GRADES.HEAVY]: {
            name: "Heavy leak",
            description: "Quickly leaks water",
            leak: 0.05,
        },
    }
}

export const RANDOM_SHUTDOWN = {
    type: "damageRandomShutdown",
    icon: "fa-solid fa-power-off",
    onUpdateState: (effect, deltaMs, model) => {
        if (effect.subsystem.on) {
            if (randomEventOccured(deltaMs, effect.param("flickerS"))) {
                effect.subsystem.addEffect(powerFlicker())
            }
            if (randomEventOccured(deltaMs, effect.param("everyS"))) {
                effect.subsystem.shutdown()
            }
        }
    },
    repairTime: 5000,
    requiredMaterials: {
        [MATERIALS.SPARE_PARTS]: 1,
    },
    grades: {
        [GRADES.LIGHT]: {
            name: "Loose cables",
            description: "Shuts down sometimes",
            flickerS: 1,
            everyS: 60,
        },
        [GRADES.MEDIUM]: {
            name: "Damaged cables",
            description: "Shuts down often",
            flickerS: 0.5,
            everyS: 30,
        },
        [GRADES.HEAVY]: {
            name: "Torn cables",
            description: "Cannot be turned on",
            shutdown: true,
        },
    }
}

export const INCREASED_POWER_CONSUMPTION = {
    type: "damageIncreasedPowerConsumption",
    icon: "fa-solid fa-bolt",
    repairTime: 5000,
    requiredMaterials: {
        [MATERIALS.SPARE_PARTS]: 1,
    },
    grades: {
        [GRADES.LIGHT]: {
            name: "Faulty transformer",
            description: "Power consumption x 2",
            powerConsumptionMultiplier: 2,
        },
        [GRADES.MEDIUM]: {
            name: "Damaged transformer",
            description: "Power consumption x 3",
            powerConsumptionMultiplier: 3,
        },
        [GRADES.HEAVY]: {
            name: "Fried transformer",
            description: "Power consumption x 4",
            powerConsumptionMultiplier: 4,
        },
    }
}
