import { Subsystem, SUBSYSTEM_CATEGORIES } from './index'
import "../../css/subsystems/reactor.css"
import { Statistic } from '../../stats'
import { Point } from '../physics'

////////////////////////////////////////
// REACTOR
////////////////////////////////////////

const REACTOR_UPDATE_HISTORY_MS = 200
const REACTOR_HISTORY_FRAMES = 100

const HIST_TIME_MS = REACTOR_HISTORY_FRAMES * REACTOR_UPDATE_HISTORY_MS;

const DEFAULT_REACTOR = {
    maxOutput: 100,
    gridSize: new Point(1, 2),
    waterResistant: true,
    reactionUpSpeed: 0.2,
    reactionDownSpeed: 0.2,
    heatUpSpeed: 0.04,
    heatDownSpeed: 0.065,
}


export class Reactor extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, SUBSYSTEM_CATEGORIES.NAVIGATION, {...DEFAULT_REACTOR, ...template})

        this.maxOutput = template.maxOutput

        this._control = 0


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

        this._reactionPower = 0
        this._heat = 0

        this._outputMultiplier = 1
        this._reactionUpMultiplier = 1
        this._reactionDownMultiplier = 1
        this._heatUpMultiplier = 1
        this._heatDownMultiplier = 1
    }


    get output() {
        return this.maxOutput * this._reactionPower * this._outputMultiplier
    }

    _updateReaction(deltaMs, model) {
        if (this._control > this._reactionPower) {
            const delta = this.template.reactionUpSpeed * this._reactionUpMultiplier * deltaMs / 1000
            this._reactionPower = Math.min(this._control, this._reactionPower + delta)
        } else if (this._control < this._reactionPower) {
            const delta = this.template.reactionDownSpeed * this._reactionDownMultiplier * deltaMs / 1000
            this._reactionPower = Math.max(this._control, this._reactionPower - delta)
        }

        if (this.output > model.sub.power.totalConsumption) {
            const overpower = Math.min(2, this.output / model.sub.power.totalConsumption)
            const delta =
                overpower * overpower
                * this.template.heatUpSpeed
                * this._heatUpMultiplier
                * deltaMs / 1000
                this._heat = Math.min(1, this._heat + delta)
        }

        const coolTo = this._reactionPower * 2 / 3
        if (this._heat > coolTo) {
            const cooling = 1
            * this.template.heatDownSpeed
            * this._heatDownMultiplier
            * deltaMs / 1000
        this._heat = Math.max(coolTo, this._heat - cooling)

        }
    }

    _updateControl(actionController) {
        if (this._externalSetControl) {
            this._externalSetControl = false
            actionController.setValue(this.id + "_control", this._control)
        }
        if (!this.on) {
            actionController.setValue(this.id + "_control", 0)
        }
        this._control = actionController.getValue(this.id + "_control", 0)
    }

    externalSetControl(val) {
        this._control = val
        this._externalSetControl = true
    }


    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)

        this._statistics.powerProduction.add(this.output, true)
        this._statistics.powerConsumption.add(model.sub.power.consumption, true)


        this._updateControl(actionController)
        this._updateReaction(deltaMs, model)
    }

    get powerGeneration() {
        return this.on ? this.output : 0
    }

   toViewState() {
        return {
            ...super.toViewState(),
            fuel: this.fuel,
            control: this._control,
            reactionPower: this._reactionPower,
            heatPercent: Math.floor(this._heat * 1000) / 10,
            isReactor: true,
            historyPowerProduction: this._statistics.powerProduction.values,
            historyPowerConsumption: this._statistics.powerConsumption.values,
            historyTo: Date.now() - 500,
            historyFrom: Date.now() - HIST_TIME_MS,
            maxOutput: this.maxOutput,
        }
    }
}

