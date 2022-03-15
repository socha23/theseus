import { Subsystem, SUBSYSTEM_CATEGORIES } from './index'
import "../../css/subsystems/reactor.css"
import { Statistic } from '../../stats'

////////////////////////////////////////
// REACTOR
////////////////////////////////////////

const REACTOR_UPDATE_HISTORY_MS = 200
const REACTOR_HISTORY_FRAMES = 100

const HIST_TIME_MS = REACTOR_HISTORY_FRAMES * REACTOR_UPDATE_HISTORY_MS;

export class Reactor extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, SUBSYSTEM_CATEGORIES.NAVIGATION, template)

        this.maxOutput = template.maxOutput

        this.fuel = 1
        this.control = 0

        this._externalSetControl = false

        this._statistics = {
            powerProduction: new Statistic({
                name: "Power production",
                unit: "W",
                retentionTime: HIST_TIME_MS,
                minFrameDistance: 200,
            }),
            powerConsumption: new Statistic({
                name: "Power consumption",
                unit: "W",
                retentionTime: HIST_TIME_MS,
                minFrameDistance: 200,
            })
        }
    }

    get output() {
        return this.maxOutput * this.control
    }

    externalSetControl(val) {
        this.control = val
        this._externalSetControl = true
    }

    get powerGeneration() {
        return this.output
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)

        this._statistics.powerProduction.add(this.output, true)
        this._statistics.powerConsumption.add(model.sub.power.consumption, true)




        if (this._externalSetControl) {
            this._externalSetControl = false
            actionController.setValue(this.id + "_control", this.control)
        }
        if (!this.on) {
            actionController.setValue(this.id + "_control", 0)
        }

        this.control = actionController.getValue(this.id + "_control", 0)
    }


   toViewState() {
        return {
            ...super.toViewState(),
            fuel: this.fuel,
            control: this.control,
            isReactor: true,
            historyPowerProduction: this._statistics.powerProduction.values,
            historyPowerConsumption: this._statistics.powerConsumption.values,
            historyTo: Date.now() - 500,
            historyFrom: Date.now() - HIST_TIME_MS,
            maxOutput: this.maxOutput,
        }
    }
}

