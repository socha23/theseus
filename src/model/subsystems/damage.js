import { SubsystemDamage } from '.'
import { randomEventOccured } from '../../utils'





export class RandomShutdown extends SubsystemDamage {
    static TYPE = "damageRandomShutdown"

    constructor(subsystem, everyS, params) {
        super(subsystem, {
            ...params,
            type: RandomShutdown.TYPE,
            name: "Torn cables",
            repairTime: 5000,
        })
        this.everyS = everyS
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
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
            ...params,
        })
    }
}
