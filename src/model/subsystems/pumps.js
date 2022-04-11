import { MATERIALS } from '../materials'
import { Subsystem } from './index'
import { LEAK, RANDOM_SHUTDOWN, INCREASED_POWER_CONSUMPTION, GRADES } from './damage'


const STANDBY_CONSUMPTION = 0.05

export class Pumps extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, template)
        this.pumping = true
        this.waterLevel = 0
        this.waterFlow = 0

        this._baseEngagesAt = 0.4

        this._pumpPowerMultiplier = 1
        this._additonalEngagesAt = 0
        this._additonalDisengagesAt = 0
    }

    get pumpPowerMultiplier() {
        return this._pumpPowerMultiplier
    }

    get engagesAt() {
        return this._baseEngagesAt + this._additonalEngagesAt
    }

    get disengagesAt() {
        return this._additonalDisengagesAt
    }

    get pumpPower() {
        return this.template.pumpPower * this.pumpPowerMultiplier
    }

    get waterResistant() {
        return true
    }

    get activePumpPower() {
        if (!this.on || !this.pumping) {
            return 0
        } else {
            return this.pumpPower
        }

    }

    get powerConsumption() {
        if (!this.pumping) {
            return super.powerConsumption * STANDBY_CONSUMPTION
        } else {
            return super.powerConsumption
        }
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)

        this._pumpPowerMultiplier = this.multiplicativeEffect("pumpPowerMultiplier")
        this._additonalEngagesAt = this.cumulativeEffect("engagesAt")
        this._additonalDisengagesAt = this.cumulativeEffect("engagesAt")

        if (this.pumping && !this.on) {
            this.pumping = false
        } else if (!this.pumping && this.on && (this.engagesAt <= model.sub.waterLevel)) {
            this.pumping = true
        } else if (this.pumping && (model.sub.waterLevel <= this.disengagesAt)) {
            this.pumping = false
        }
        this.waterLevel = model.sub.waterLevel
        this.waterFlow = model.sub.leak
    }

    get leak() {
        return super.leak - (this.activePumpPower)
    }

    createViewState(model) {
        return {
            pumpPower: this.pumpPower,
            activePumpPower: this.activePumpPower,
            pumpPowerMultiplier: this.pumpPowerMultiplier,
            pumping: this.pumping,
            isPumps: true,
            waterLevel: this.waterLevel,
            waterFlow: this.waterFlow,
        }
    }

    getDamageTypes() {
        return [
            RANDOM_SHUTDOWN,
            INCREASED_POWER_CONSUMPTION,
            INCREASED_POWER_CONSUMPTION,
            REDUCED_POWER,
            REDUCED_POWER,
            PRESSURE_FAILURE,
            PRESSURE_FAILURE,
            LEAK,
            LEAK,
            LEAK,
        ]
    }

}


export const REDUCED_POWER = {
    type: "damageReducedPower",
    icon: "fa-solid fa-gears",
    repairTime: 5000,
    requiredMaterials: {
        [MATERIALS.SPARE_PARTS]: 1,
    },
    grades: {
        [GRADES.LIGHT]: {
            name: "Run-down motor",
            description: "Slightly limited pump power",
            pumpPowerMultiplier: 0.8,
        },
        [GRADES.MEDIUM]: {
            name: "Damaged motor",
            description: "Limited pump power",
            pumpPowerMultiplier: 0.5,
        },
        [GRADES.HEAVY]: {
            name: "Wrecked motor",
            description: "Severly limited pump power",
            pumpPowerMultiplier: 0.25,
        },
    }
}


export const PRESSURE_FAILURE = {
    type: "damagePressureFail",
    icon: "fa-solid fa-water",
    repairTime: 5000,
    requiredMaterials: {
        [MATERIALS.SPARE_PARTS]: 1,
    },
    grades: {
        [GRADES.LIGHT]: {
            name: "Tank pierced",
            description: "Can't pump water from last row",
            engagesAt: 1,
            disengagesAt: 1,
        },
        [GRADES.MEDIUM]: {
            name: "Tank damaged",
            description: "Can't pump water from two last rows",
            engagesAt: 2,
            disengagesAt: 2,
        },
        [GRADES.HEAVY]: {
            name: "Tank breached",
            description: "Can't pump water from three last rows",
            engagesAt: 3,
            disengagesAt: 3,
        },
    }
}

