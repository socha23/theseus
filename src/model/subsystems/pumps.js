import { IncreasedPowerConsumption, RandomShutdown } from './damage'
import { Subsystem, SUBSYSTEM_CATEGORIES, SubsystemDamage } from './index'


const STANDBY_CONSUMPTION = 0.05

export class Pumps extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, SUBSYSTEM_CATEGORIES.DEFAULT, template)
        this.pumping = true
        this.waterLevel = 0
        this.waterFlow = 0
        this.engagesAt = 0.4
        this.disengagesAt = 0.1
    }

    get pumpPower() {

        var multiplier = 1
        this.statusEffects.filter(e => e instanceof ReducedPumpPower).forEach(e => {
            multiplier = multiplier * e.multiplier
        })

        return this.template.pumpPower * multiplier
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

        if (!this.pumping && this.on && (this.engagesAt < model.sub.waterLevel)) {
            this.pumping = true
        } else if (this.pumping && (model.sub.waterLevel < this.disengagesAt)) {
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
            ReducedPumpPower.TYPE,
        ]
    }

    getAvailableHeavyDamageTypes() {
        return []
    }

    createDamageOfType(type) {
        if (type === RandomShutdown.TYPE) {
            return new RandomShutdown(this, 60)
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
        return super.createDamageOfType(type)
    }

}

export class LeakySeal extends SubsystemDamage {
    static TYPE = "damageLeakySeal"

    constructor(subsystem, params) {
        super(subsystem, {
            type: LeakySeal.TYPE,
            name: "Leaky seal",
            repairTime: 5000,
            leak: 0.02,
            ...params,
        })
    }
}

export class ReducedPumpPower extends SubsystemDamage {
    static TYPE = "damageReducedPumpPower"

    constructor(multiplier, subsystem, params) {
        super(subsystem, {
            type: ReducedPumpPower.TYPE,
            name: "Bent plunger",
            repairTime: 5000,
            ...params,
        })
        this.multiplier = multiplier
    }
}

// engage and disengage at higher water level

// tank breach, can't operate underwater

// motor broken, no use
// ruptured bearing , leak
