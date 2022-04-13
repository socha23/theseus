import { MATERIALS } from '../materials'
import { Subsystem } from './index'
import { LEAK, RANDOM_SHUTDOWN, GRADES } from './damage'
import { randomEventOccured } from '../../utils'

export const BATTERY_DEFAULTS = {
    capacity: 3000,
    chargeUpRate: 20,
    drawChargeRate: 40,
}

export class Battery extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, {...BATTERY_DEFAULTS, ...template})
        this.charge = 0
        this._chargeUpRateMultiplier = 1
        this._drawChargeMultiplier = 1
        this._capacityMultiplier = 1

        this._drawCharge = 0
        this._chargeUp = 0
    }

    get maxCapacity() {
        return this.param("capacity")
    }

    get capacity() {
        return this.maxCapacity * this._capacityMultiplier
    }

    get needsCharging() {
        const result = this.charge < this.capacity
        return result
    }

    get chargeUpRate() {
        return this.param("chargeUpRate") * this._chargeUpRateMultiplier
    }

    chargeUp(charge) {
        this._chargeUp = charge
    }

    get providesCharge() {
        return this.charge > 0
    }

    get drawChargeRate() {
        return this.param("drawChargeRate", 0)
    }

    drawCharge(charge) {
        this._drawCharge = charge
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)

        this._chargeUpRateMultiplier = this.multiplicativeEffect("chargeUpRate")
        this._drawChargeMultiplier = this.multiplicativeEffect("drawCharge")
        this._capacityMultiplier = this.multiplicativeEffect("capacity")

        if (this.charge > this.capacity) {
            this.charge = this.capacity
        }

        if (this._chargeUp > 0) {
            this.charge = Math.min(this.capacity, this.charge +
                this._chargeUp
                * deltaMs / 1000
                )
        }
        if (this._drawCharge > 0) {
            this.charge = Math.max(0, this.charge -
                this._drawCharge
                * this._drawChargeMultiplier
                * deltaMs / 1000
                )
        }
        this._drawCharge = 0
        this._chargeUp = 0
    }

    createViewState(model) {
        return {
            isBattery: true,
            charge: Math.floor(this.charge * 10) / 10,
            chargePercent: Math.floor(this.charge / this.maxCapacity * 100),
            chargeUp: this._chargeUp,
            drawCharge: this._drawCharge,
        }
    }

    getDamageTypes() {
        return [
            RANDOM_SHUTDOWN,
            REDUCED_CAPACITY,
            REDUCED_CHARGE_UP_RATE,
            DRAW_CHARGE_INCREASED,
            RANDOM_DISCHARGE,
            LEAK,
            LEAK,
            LEAK,
        ]
    }
}

const REDUCED_CAPACITY = {
    type: "damageReducedCapacity",
    icon: "fa-solid fa-car-battery",
    repairTime: 5000,
    requiredMaterials: {
        [MATERIALS.SPARE_PARTS]: 1,
    },
    grades: {
        [GRADES.LIGHT]: {
            name: "Flooded capacitors",
            description: "Capacity slightly decreased",
            capacity: 0.8,
        },
        [GRADES.MEDIUM]: {
            name: "Damaged capacitors",
            description: "Capacity decreased",
            capacity: 0.5,
        },
        [GRADES.HEAVY]: {
            name: "Fried capacitors",
            description: "Capacity highly decreased",
            capacity: 0.3,
        },
    },
}

const REDUCED_CHARGE_UP_RATE = {
    type: "damageReducedChargeUpRate",
    icon: "fa-solid fa-calendar-minus",
    repairTime: 5000,
    requiredMaterials: {
        [MATERIALS.SPARE_PARTS]: 1,
    },
    grades: {
        [GRADES.LIGHT]: {
            name: "Struck coils",
            description: "Charge rate slightly reduced",
            chargeUpRate: 0.8,
        },
        [GRADES.MEDIUM]: {
            name: "Broken coils",
            description: "Charge rate reduced",
            chargeUpRate: 0.5,
        },
        [GRADES.HEAVY]: {
            name: "Smashed coils",
            description: "Charge rate highly reduced",
            chargeUpRate: 0.2,
        },
    },
}

const DRAW_CHARGE_INCREASED = {
    type: "damageDrawChargeIncreased",
    icon: "fa-solid fa-bolt-lightning",
    repairTime: 5000,
    requiredMaterials: {
        [MATERIALS.SPARE_PARTS]: 1,
    },
    grades: {
        [GRADES.LIGHT]: {
            name: "Singed transformer",
            description: "A little charge is wasted when drawn",
            drawCharge: 1.3,
        },
        [GRADES.MEDIUM]: {
            name: "Burnt transformer",
            description: "Some charge is wasted when drawn",
            drawCharge: 1.7,
        },
        [GRADES.HEAVY]: {
            name: "Ravaged transformer",
            description: "A lot of charge is wasted when drawn",
            drawCharge: 2.5,
        },
    },
}

const RANDOM_DISCHARGE = {
    type: "damageRandomDischarge",
    icon: "fa-solid fa-battery-empty",
    onUpdateState: (effect, deltaMs, model) => {
        if (effect.subsystem.on) {
            if (randomEventOccured(deltaMs, effect.param("everyS"))) {
                effect.subsystem.charge = 0
            }
        }
    },
    repairTime: 5000,
    requiredMaterials: {
        [MATERIALS.SPARE_PARTS]: 1,
    },
    grades: {
        [GRADES.LIGHT]: {
            name: "Worn-down electronics",
            description: "Looses charge sometimes",
            everyS: 150,
        },
        [GRADES.MEDIUM]: {
            name: "Damaged electronics",
            description: "Looses charge often",
            everyS: 90,
        },
        [GRADES.HEAVY]: {
            name: "Burnt electronics",
            description: "Looses charge very often",
            everyS: 30,
        },
    }
}
