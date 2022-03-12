import { Subsystem, SUBSYSTEM_CATEGORIES } from './index'


const STANDBY_CONSUMPTION = 0.05

export class Pumps extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, SUBSYSTEM_CATEGORIES.DEFAULT, template)
        this.pumping = true
    }

    get pumpPower() {
        return this.template.pumpPower
    }

    get activePumpPower() {
        if (!this.on || !this.pumping) {
            return 0
        } else {
            return this.template.pumpPower
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
        this.pumping = (model.sub.waterLevel > 0)
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
        }
    }

}
