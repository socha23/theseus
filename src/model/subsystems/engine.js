import { MATERIALS } from '../materials'
import { Subsystem } from './index'
import { LEAK, RANDOM_SHUTDOWN, INCREASED_POWER_CONSUMPTION, GRADES } from './damage'

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


    getDamageTypes() {
        return [
            RANDOM_SHUTDOWN,
            INCREASED_POWER_CONSUMPTION,
            INCREASED_POWER_CONSUMPTION,
            REDUCED_POWER,
            REDUCED_POWER,
            REDUCED_POWER,
            LEAK,
            LEAK,
            LEAK,
        ]
    }
}

export const REDUCED_POWER = {
    type: "damageReducedDrivingPower",
    icon: "fa-solid fa-fan",
    repairTime: 5000,
    requiredMaterials: {
        [MATERIALS.SPARE_PARTS]: 1,
    },
    grades: {
        [GRADES.LIGHT]: {
            name: "Run-down motor",
            description: "Slightly limited engine power",
            rotationMultiplier: 0.7,
            thrustMultiplier: 0.7,
        },
        [GRADES.MEDIUM]: {
            name: "Damaged motor",
            description: "Limited engine powerr",
            rotationMultiplier: 0.4,
            thrustMultiplier: 0.4,
        },
        [GRADES.HEAVY]: {
            name: "Wrecked motor",
            description: "Severly limited engine power",
            rotationMultiplier: 0.2,
            thrustMultiplier: 0.2,
        },
    }
}

