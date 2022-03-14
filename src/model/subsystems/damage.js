import { SubsystemDamage } from '.'
import { randomEventOccured } from '../../utils'
import { powerFlicker } from '../effects'
import { MATERIALS } from '../materials'




export class RandomShutdown extends SubsystemDamage {
    static TYPE = "damageRandomShutdown"

    constructor(subsystem, everyS, params) {
        super(subsystem, {
            type: RandomShutdown.TYPE,
            name: "Torn cables",
            repairTime: 5000,
            description: "Shuts down sometimes",
            requiredMaterials: {
                [MATERIALS.SPARE_PARTS]: 1,
            },
            ...params,
        })
        this.everyS = everyS
        this._flickerEveryS = 1
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        if (this.subsystem.on && randomEventOccured(deltaMs, this._flickerEveryS)) {
            this.subsystem.addEffect(powerFlicker())
        }
        if (this.subsystem.on && randomEventOccured(deltaMs, this.everyS)) {
            this.subsystem.shutdown()
        }
    }
}

export class IncreasedPowerConsumption extends SubsystemDamage {
    static TYPE = "damageIncreasedPowerCnsumption"

    constructor(subsystem, params) {
        super(subsystem, {
            type: IncreasedPowerConsumption.TYPE,
            name: "Damaged transformer",
            repairTime: 5000,
            powerConsumptionMultiplier: 2,
            description: "Increased power consumption",
            requiredMaterials: {
                [MATERIALS.SPARE_PARTS]: 2,
            },
            ...params,
        })
    }
}

export class BrokenDown extends SubsystemDamage {
    static TYPE = "damageBrokenDown"

    constructor(subsystem, params) {
        super(subsystem, {
            type: BrokenDown.TYPE,
            name: "Broken down",
            description: "Can't be turned on",
            repairTime: 5000,
            requiredMaterials: {
                [MATERIALS.SPARE_PARTS]: 5,
            },
            shutdown: true,
            ...params,
        })
    }
}
