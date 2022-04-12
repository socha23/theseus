import { Subsystem } from './index'
import "../../css/subsystems/reactor.css"
import { Statistic } from '../../stats'
import { Point } from '../physics'
import { MATERIALS, MATERIAL_DEFINITIONS } from '../materials'
import { action } from '../action'
import { randomEventOccured } from '../../utils'
import { LEAK, GRADES } from './damage'

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
    refuelTime: 3000,
    reactionUpSpeed: 0.2,
    reactionDownSpeed: 0.05,
    heatUpSpeed: 40,
    heatDownSpeed: 40,
    fuelConsumption: 0.001,
    overheatsAt: 0.9,
    overpowerMargin: 0.2,
}

const OVERHEAT_SAFETY_MARGIN_MS = 3000
const MELTDOWN_EVERY_S = 6

const UPDATE_REACTION_EVERY_MS = 100

export class Reactor extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, {...DEFAULT_REACTOR, ...template})

        this.maxOutput = template.maxOutput

        this._externalSetControl = false
        this._externalSetControlVal = 0

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
        this.scramAction = action({
            id: id + "_scram",
            name: "Scram",
            longName: "Shutdown the reactor fast",
            icon: "fa-solid fa-fire-extinguisher",
            progressTime: 500,
            addErrorConditions: c => this._addScramErrors(c),
            onCompleted: m => {this._onScram(m)},
            requiresOperator: true,
        })
        this.actions.push(this.scramAction)

        this.refuelAction = action({
            id: id + "_refuel",
            name: "Refuel",
            longName: "Insert new fuel rod",
            icon: MATERIAL_DEFINITIONS[MATERIALS.FUEL_RODS].icon,
            progressTime: this.template.refuelTime,
            addErrorConditions: c => {this._addRefuelErrors(c)},
            onCompleted: m => {this._onRefuel(m)},
            requiresOperator: true,
            requiredMaterials: {
                [MATERIALS.FUEL_RODS]: 1
            },
        })
        this.actions.push(this.refuelAction)

        this._control = 0
        this._fuel = 1
        this._reactionPower = 0
        this._heat = 0

        this._outputMultiplier = 1
        this._reactionUpMultiplier = 1
        this._reactionDownMultiplier = 1
        this._heatUpMultiplier = 1
        this._heatDownMultiplier = 1
        this._additionalOverheatsAt = 0

        this._overheating = false
        this._timeSinceOverheating = 0

        this._timeSinceReactionUpdated = 0

    }

    addStatusPowerErrorConditions(c, model) {
        super.addStatusPowerErrorConditions(c, model)
        if (this._fuel === 0) {
            c.push("Out of fuel")
        }
    }

    get output() {
        return this.maxOutput * this._reactionPower * this._outputMultiplier
    }

    _onRefuel(model) {
        this._fuel = 1
    }

    _addRefuelErrors(c) {

    }

    _onScram(model) {
        this.addDamage(GRADES.HEAVY, SCRAMMED)
    }

    _addScramErrors(c) {
        if (!this._reactionPower) {
            c.push("Reactor not working")
        }
    }

    _updateReaction(deltaMs, model) {

        this._reactionUpMultiplier = this.multiplicativeEffect("reactionUp")
        this._reactionDownMultiplier = this.multiplicativeEffect("reactionDown")
        this._outputMultiplier = this.multiplicativeEffect("output")
        this._additionalOverheatsAt = this.cumulativeEffect("overheatsAt")

        if (this.on && !this._fuel) {
            this.shutdown(false)
        }

        if (this._control > this._reactionPower) {
            const delta = this.template.reactionUpSpeed * this._reactionUpMultiplier * deltaMs / 1000
            this._reactionPower = Math.min(this._control, this._reactionPower + delta)
        } else if (this._control < this._reactionPower) {
            const delta = this.template.reactionDownSpeed * this._reactionDownMultiplier * deltaMs / 1000
            this._reactionPower = Math.max(this._control, this._reactionPower - delta)
        }

        var destHeat = this._reactionPower
        if (this.output > model.sub.power.totalConsumption) {
            const overpower = (this.output - model.sub.power.totalConsumption) / this.maxOutput
            if (overpower > this.template.overpowerMargin) {
                destHeat += overpower - this.template.overpowerMargin
            }
        }

        // cooling works only when reactor is turned on
        if (this.on && (destHeat > this._reactionPower)) {
            destHeat -= 0.1
        }
        if (this.hasEffectOfType(SCRAMMED.type)) {
            destHeat = 0
            this._reactionPower = 0
        }

        var delta = 0
        if (destHeat > this._heat) {
            delta = this.template.heatUpSpeed / 1000
                * this._heatUpMultiplier
                * deltaMs / 1000
        } else if (destHeat < this._heat) {
            delta = -this.template.heatDownSpeed / 1000
                * this._heatDownMultiplier
                * deltaMs / 1000
        }

        this._heat = Math.max(0, Math.min(1, this._heat + delta))

        this._overheating = this._heat >= this.template.overheatsAt + this._additionalOverheatsAt
        if (this._overheating) {
            this._timeSinceOverheating += deltaMs
            if (this._timeSinceOverheating > OVERHEAT_SAFETY_MARGIN_MS) {
                if (randomEventOccured(deltaMs, MELTDOWN_EVERY_S)) {
                    this.onMeltdown(model)
                }
            }

        } else {
            this._timeSinceOverheating = 0
        }

        const consumedFuel = this._reactionPower * this.template.fuelConsumption * deltaMs / 1000
        this._fuel = Math.max(0, this._fuel - consumedFuel)
    }

    onMeltdown(model) {
        this.addDamage(GRADES.HEAVY, MELTDOWN)
        model.sub.onMeltdown()
        this._heat = 0
        this._fuel = 0
        this._reactionPower = 0

    }

    _updateControl(actionController) {
        if (this._externalSetControl) {
            this._externalSetControl = false
            actionController.setValue(this.id + "_control", this._externalSetControlVal)
        } else if (!this.on) {
            actionController.setValue(this.id + "_control", 0)
        }
        this._control = actionController.getValue(this.id + "_control", 0)
    }

    externalSetControl(val) {
        this._externalSetControlVal = val
        this._externalSetControl = true
    }


    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        this._statistics.powerProduction.add(this.output, true)
        this._statistics.powerConsumption.add(model.sub.power.consumption, true)

        this._timeSinceReactionUpdated += deltaMs
        while (this._timeSinceReactionUpdated > UPDATE_REACTION_EVERY_MS) {
            this._updateReaction(UPDATE_REACTION_EVERY_MS, model)
            this._timeSinceReactionUpdated -= UPDATE_REACTION_EVERY_MS
        }

        this._updateControl(actionController)
    }

    get powerGeneration() {
        return this.on ? this.output : 0
    }

   createViewState(model) {
        return {
            fuel: this._fuel,
            control: this._control,
            reactionPower: this._reactionPower,
            heatPercent: Math.floor(this._heat * 1000) / 10,
            isReactor: true,
            historyPowerProduction: this._statistics.powerProduction.values,
            historyPowerConsumption: this._statistics.powerConsumption.values,
            historyTo: Date.now() - 500,
            historyFrom: Date.now() - HIST_TIME_MS,
            maxOutput: this.maxOutput,
            refuelAction: this.refuelAction.toViewState(),
            scramAction: this.scramAction.toViewState(),
            overheating: this._overheating,
        }
    }

    getDamageTypes() {
        return [
            REDUCED_OUTPUT,
            REDUCED_OUTPUT,
            REDUCED_OVERHEATS_AT,
            REDUCED_REACTION_SPEED,
            REDUCED_REACTION_SPEED,
            LEAK,
            LEAK,
        ]
    }
}

export const SCRAMMED = {
    type: "damageScrammed",
    name: "Reactor scrammed",
    description: "At least it didn't melt down.",
    icon: "fa-solid fa-fire-extinguisher",
    repairTime: 15000,
    shutdown: true,
    requiredMaterials: {},
}

export const MELTDOWN = {
    type: "damageMeltdown",
    name: "Meltdown",
    description: "Core melted down",
    icon: "fa-solid fa-radiation",
    repairTime: 15000,
    shutdown: true,
    requiredMaterials: {
        [MATERIALS.SPARE_PARTS]: 3,
    },
}

export const REDUCED_OVERHEATS_AT = {
    type: "damageReducedOverheatAt",
    icon: "fa-solid fa-fire",
    repairTime: 5000,
    requiredMaterials: {
        [MATERIALS.SPARE_PARTS]: 1,
    },
    grades: {
        [GRADES.LIGHT]: {
            name: "Containment bent",
            description: "Overheats at little lower temperature",
            overheatsAt: -0.1
        },
        [GRADES.MEDIUM]: {
            name: "Containment breached",
            description: "Overheats at lower temperature",
            overheatsAt: -0.25
        },
        [GRADES.HEAVY]: {
            name: "Containment broken",
            description: "Overheats at much lower temperature",
            overheatsAt: -0.5
        },
    },
}

export const REDUCED_REACTION_SPEED = {
    type: "damageReducedReactionSpeed",
    icon: "fa-solid fa-up-down",
    repairTime: 5000,
    requiredMaterials: {
        [MATERIALS.SPARE_PARTS]: 1,
    },
    grades: {
        [GRADES.LIGHT]: {
            name: "Control rods bent",
            description: "Sligthly slower reaction adjustment",
            reactionUp: 0.8,
            reactionDown: 0.8,
        },
        [GRADES.MEDIUM]: {
            name: "Control rods damaged",
            description: "Slower reaction adjustment",
            reactionUp: 0.5,
            reactionDown: 0.5,
        },
        [GRADES.HEAVY]: {
            name: "Control rods broken",
            description: "Much slower reaction adjustment",
            reactionUp: 0.2,
            reactionDown: 0.2,
        },
    },
}

export const REDUCED_OUTPUT = {
    type: "damageReducedOutput",
    icon: "fa-solid fa-bolt-lightning",
    repairTime: 5000,
    requiredMaterials: {
        [MATERIALS.SPARE_PARTS]: 1,
    },
    grades: {
        [GRADES.LIGHT]: {
            name: "Turbines frayed",
            description: "Slightly reduced power output",
            output: 0.8,
        },
        [GRADES.MEDIUM]: {
            name: "Turbines damaged",
            description: "Reduced power output",
            output: 0.6,
        },
        [GRADES.HEAVY]: {
            name: "Turbines smashed",
            description: "Highly reduced power output",
            output: 0.4,
        },
    },
}
