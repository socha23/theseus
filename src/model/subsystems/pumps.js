import { MATERIALS } from '../materials'
import { BrokenDown, IncreasedPowerConsumption, RandomShutdown } from './damage'
import { Subsystem, SUBSYSTEM_CATEGORIES, SubsystemDamage, DAMAGE_CATEGORY } from './index'


const STANDBY_CONSUMPTION = 0.05

export class Pumps extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, SUBSYSTEM_CATEGORIES.DEFAULT, template)
        this.pumping = true
        this.waterLevel = 0
        this.waterFlow = 0
        this._engagesAt = 0.4
        this._disengagesAt = 0
        this._pumpPowerMultiplier = 1
    }

    get pumpPowerMultiplier() {
        return this._pumpPowerMultiplier
    }

    get engagesAt() {
        const effect = this.statusEffects.find(e => e instanceof HigherEngage)
        return this._engagesAt + (effect ? effect.engage : 0)
    }

    get disengagesAt() {
        const effect = this.statusEffects.find(e => e instanceof HigherEngage)
        return this._disengagesAt + (effect ? effect.disengage : 0)
    }

    get pumpPower() {
        return this.template.pumpPower * this.pumpPowerMultiplier
    }

    get waterResistant() {
        return super.waterResistant && (!this.statusEffects.some(e => e instanceof TankBreach))
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

        this._pumpPowerMultiplier = 1
        this.statusEffects.filter(s => s instanceof ReducedPumpPower).forEach(s => {
            this._pumpPowerMultiplier *= s.multiplier
        })

        if (!this.pumping && this.on && (this.engagesAt <= model.sub.waterLevel)) {
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

    toViewState() {
        return {
            ...super.toViewState(),
            pumpPower: this.pumpPower,
            activePumpPower: this.activePumpPower,
            pumpPowerMultiplier: this.pumpPowerMultiplier,
            pumping: this.pumping,
            isPumps: true,
            waterLevel: this.waterLevel,
            waterFlow: this.waterFlow,
        }
    }

    getAvailableLightDamageTypes() {
        return [
            ...super.getAvailableLightDamageTypes(),
            RandomShutdown.TYPE,
            IncreasedPowerConsumption.TYPE,
            LeakySeal.TYPE,
        ]
    }


    getAvailableMediumDamageTypes() {
        return [
            ...super.getAvailableMediumDamageTypes(),
            ReducedPumpPower.TYPE,
            HigherEngage.TYPE,
        ]
    }

    getAvailableHeavyDamageTypes() {
        return [
            ...super.getAvailableHeavyDamageTypes(),
            TankBreach.TYPE,
            BrokenDown.TYPE,
            RupturedBearing.TYPE,
        ]
    }

    createDamageOfType(type) {
        if (type === RandomShutdown.TYPE) {
            return new RandomShutdown(this)
        }
        if (type === IncreasedPowerConsumption.TYPE) {
            return new IncreasedPowerConsumption(this)
        }
        if (type === LeakySeal.TYPE) {
            return new LeakySeal(this)
        }
        if (type === ReducedPumpPower.TYPE) {
            return new ReducedPumpPower(0.5, this)
        }
        if (type === HigherEngage.TYPE) {
            return new HigherEngage(this, {})
        }
        if (type === TankBreach.TYPE) {
            return new TankBreach(this, {})
        }
        if (type === BrokenDown.TYPE) {
            return motorBroken(this)
        }
        if (type === RupturedBearing.TYPE) {
            return new RupturedBearing(this)
        }
        return super.createDamageOfType(type)
    }

}

//////////
// LIGHT DAMAGE
//////////

// RandomShutdown
// IncPowerConsumption

export class LeakySeal extends SubsystemDamage {
    static TYPE = "damageLeakySeal"

    constructor(subsystem, params) {
        super(subsystem, {
            type: LeakySeal.TYPE,
            damageCategory: DAMAGE_CATEGORY.LIGHT,
            name: "Leaky seal",
            description: "Slowly leaks water",
            repairTime: 5000,
            leak: 0.02,
            requiredMaterials: {
                [MATERIALS.LEAK_SEALS]: 1,
            },
            ...params,
        })
    }
}

//////////
// MEDIUM DAMAGE
//////////

export class ReducedPumpPower extends SubsystemDamage {
    static TYPE = "damageReducedPumpPower"

    constructor(multiplier, subsystem, params) {
        super(subsystem, {
            type: ReducedPumpPower.TYPE,
            damageCategory: DAMAGE_CATEGORY.MEDIUM,
            name: "Bent plunger",
            description: "Reduced pumping power",
            repairTime: 5000,
            requiredMaterials: {
                [MATERIALS.SPARE_PARTS]: 1,
            },
            ...params,
        })
        this.multiplier = multiplier
    }
}

export class HigherEngage extends SubsystemDamage {
    static TYPE = "damageHigherEngage"

    constructor(subsystem, params, engage = 2, disengage = 1) {
        super(subsystem, {
            type: HigherEngage.TYPE,
            damageCategory: DAMAGE_CATEGORY.MEDIUM,
            name: "Sensor broken",
            description: "Engages only at high water level",
            repairTime: 5000,
            requiredMaterials: {
                [MATERIALS.SPARE_PARTS]: 3,
            },
            ...params,
        })
        this.engage = engage
        this.disengage = disengage
    }
}



//////////
// HEAVY DAMAGE
//////////

// tank breach, can't operate underwater
export class TankBreach extends SubsystemDamage {
    static TYPE = "damageTankBreach"

    constructor(subsystem, params) {
        super(subsystem, {
            type: TankBreach.TYPE,
            damageCategory: DAMAGE_CATEGORY.HEAVY,
            name: "Pipes ruptured",
            description: "Can't operate underwater",
            requiredMaterials: {
                [MATERIALS.SPARE_PARTS]: 3,
            },
            repairTime: 5000,
            ...params,
        })
    }
}

// motor broken, no use
function motorBroken(subsystem, params = {}) {
    return new BrokenDown(subsystem, {
        name: "Motor busted",
        damageCategory: DAMAGE_CATEGORY.HEAVY,
        ...params,
    })
}

// ruptured bearing , leak
export class RupturedBearing extends SubsystemDamage {
    static TYPE = "damageRupturedBearing"

    constructor(subsystem, params) {
        super(subsystem, {
            type: RupturedBearing.TYPE,
            damageCategory: DAMAGE_CATEGORY.HEAVY,
            name: "Broken bearing",
            description: "Strong water leak",
            repairTime: 5000,
            leak: 0.1,
            requiredMaterials: {
                [MATERIALS.SPARE_PARTS]: 1,
                [MATERIALS.LEAK_SEALS]: 1,
            },
            ...params,
        })
    }
}
