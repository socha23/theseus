import { MATERIALS } from '../materials'
import { Subsystem } from './index'
import { LEAK, RANDOM_SHUTDOWN, GRADES } from './damage'

export const BATTERY_DEFAULTS = {
    capacity: 3000,
    chargeUpRate: 20,
    drawChargeRate: 20,
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
            LEAK,
        ]
    }
}
