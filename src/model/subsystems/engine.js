import { MATERIALS } from '../materials'
import { Subsystem, SubsystemDamage, DAMAGE_CATEGORY } from './index'

const THRUST_THROTTLE_CHANGE_SPEED = 1
const ROT_THROTTLE_CHANGE_SPEED = 5

export class Engine extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, template)

        this._nominalThrust = template.force
        this._thrustForceMultiplier = 1
        this._activeThrustThrottle = 0

        this._nominalRotation = template.rotationalForce
        this._rotForceMultiplier = 1
        this._activeRotThrottle = 0

        this._activeSpeed = 0
    }

    get nominalPowerConsumption() {
        return 0.1 * this._powerConsumption * this._powerConsumptionMultiplier
    }

    get powerConsumption() {
        const consumption = this.on ? (this._powerConsumption * this._powerConsumptionMultiplier) : 0
        return 0.1 * consumption
            + 0.6 * consumption * Math.abs(this._activeThrustThrottle)
            + 0.3 * consumption * Math.abs(this._activeRotThrottle)
    }

    isEngine() {
        return true
    }

    get activeThrustForce() {
        return this.nominalThrust * this._activeThrustThrottle
    }

    get nominalThrust() {
        return this._nominalThrust * this._thrustForceMultiplier
    }

    get activeRotationForce() {
        return this._nominalRotation * this._activeRotThrottle * this._rotForceMultiplier
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)

        this._rotForceMultiplier = this.multiplicativeEffect("rotationMultiplier")
        this._thrustForceMultiplier = this.multiplicativeEffect("thrustMultiplier")
        this._activeSpeed = model.sub.body.speed.length

        if (this.on) {
            const desiredThrustThr = model.sub.steering.throttle
            if (Math.abs(desiredThrustThr - this._activeThrustThrottle) > 0.01) {
                const delta = (deltaMs / 1000) * THRUST_THROTTLE_CHANGE_SPEED
                if (desiredThrustThr > this._activeThrustThrottle) {
                    this._activeThrustThrottle = Math.min(desiredThrustThr, this._activeThrustThrottle + delta)
                } else {
                    this._activeThrustThrottle = Math.max(desiredThrustThr, this._activeThrustThrottle - delta)
                }
            }

            var desiredDirThr = model.sub.steering.direction

            if (desiredDirThr === 0 && Math.abs(model.sub.body.rotationSpeed) > 0.05) {
                desiredDirThr = -Math.sign(model.sub.body.rotationSpeed)
            }

            if (Math.abs(desiredDirThr - this._activeRotThrottle) > 0.01) {
                const delta = (deltaMs / 1000) * ROT_THROTTLE_CHANGE_SPEED
                if (desiredDirThr > this._activeRotThrottle) {
                    this._activeRotThrottle = Math.min(desiredDirThr, this._activeRotThrottle + delta)
                } else {
                    this._activeRotThrottle = Math.max(desiredDirThr, this._activeRotThrottle - delta)
                }
            }
        } else {
            this._activeThrustThrottle = 0
            this._activeRotThrottle = 0
        }
    }

    createViewState(model) {
        return {
            isEngine: true,

            thrustThrottlePercent: (Math.floor(this._activeThrustThrottle * this._thrustForceMultiplier * 100)),
            nominalThrust: this.nominalThrust,
            activeThrust: this.activeThrustForce,
            thrustMultiplier: this._thrustForceMultiplier,

            rotationThrottlePercent: (Math.floor(this._activeRotThrottle * this._rotForceMultiplier * 100)),
            nominalRotation: this._nominalRotation,
            activeRotation: this.activeRotationForce,
            rotationMultiplier: this._rotForceMultiplier,

            speed: this._activeSpeed,
        }
    }
}


const DEFAULT_REDUCED_POWER = {
    rotationMultiplier: 0.5,
    thrustMultiplier: 0.5,
}

class ReducedPower extends SubsystemDamage {
    constructor(subsystem, params) {
        super(subsystem, {...DEFAULT_REDUCED_POWER, ...params})
    }

    get rotationMultiplier() {
        return this.params.rotationMultiplier
    }

    get thrustMultiplier() {
        return this.params.thrustMultiplier
    }
}

//////////
// LIGHT DAMAGE
//////////

// bent propeller
const DAMAGE_BENT_PROPELLER = "damageBentPropelled"
function bentPropeller(subsystem, params = {}) {
    return new ReducedPower(subsystem, {
        type: DAMAGE_BENT_PROPELLER,
        damageCategory: DAMAGE_CATEGORY.LIGHT,
        name: "Bent propeller",
        description: "Slightly reduced power",
        repairTime: 5000,
        requiredMaterials: {
            [MATERIALS.SPARE_PARTS]: 2,
        },
        rotationMultiplier: 0.7,
        thrustMultiplier: 0.7,
        ...params,
    })
}

// leaky seal, small leak
const DAMAGE_LEAKY_SEAL = "damageLeakySeal"
function leakySeal(subsystem, params = {}) {
    return new SubsystemDamage(subsystem, {
        type: DAMAGE_LEAKY_SEAL,
        damageCategory: DAMAGE_CATEGORY.LIGHT,
        name: "Leaky seal",
        description: "Small water leak",
        repairTime: 5000,
        leak: 0.02,
        requiredMaterials: {
            [MATERIALS.SPARE_PARTS]: 1,
            [MATERIALS.LEAK_SEALS]: 1,
        },
        ...params,
    })
}


//////////
// MEDIUM DAMAGE
//////////


// jammed bearings
const DAMAGE_JAMMED_BEARINGS = "damageJammedBearings"
function jammedPowertrain(subsystem, params = {}) {
    return new ReducedPower(subsystem, {
        type: DAMAGE_JAMMED_BEARINGS,
        damageCategory: DAMAGE_CATEGORY.MEDIUM,
        name: "Jammed bearings",
        description: "Reduced power",
        repairTime: 5000,
        requiredMaterials: {
            [MATERIALS.SPARE_PARTS]: 2,
        },
        rotationMultiplier: 0.3,
        thrustMultiplier: 0.3,
        ...params,
    })
}

// damaged housing, med leak
const DAMAGE_DAMAGED_HOUSING = "damageDamagedHousing"
function rupturedHousing(subsystem, params = {}) {
    return new SubsystemDamage(subsystem, {
        type: DAMAGE_DAMAGED_HOUSING,
        damageCategory: DAMAGE_CATEGORY.MEDIUM,
        name: "Damaged housing",
        description: "Water leak",
        repairTime: 5000,
        leak: 0.04,
        requiredMaterials: {
            [MATERIALS.SPARE_PARTS]: 1,
            [MATERIALS.LEAK_SEALS]: 1,
        },
        ...params,
    })
}
