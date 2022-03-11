import {PressAction, ACTION_CATEGORY, action } from '../action'
import { Subsystem, SUBSYSTEM_CATEGORIES } from './index'


////////////////////////////////////////
// REACTOR
////////////////////////////////////////

const REACTOR_UPDATE_HISTORY_MS = 200
const REACTOR_HISTORY_FRAMES = 100

const HIST_TIME_MS = REACTOR_HISTORY_FRAMES * REACTOR_UPDATE_HISTORY_MS;

export class Reactor extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, SUBSYSTEM_CATEGORIES.NAVIGATION, template)

        this.template = template
        this.maxOutput = template.maxOutput

        this.fuel = 1
        this.control = 0
        this.outputHistory = []

        this._historyX = 0
        for (var i = 0; i < REACTOR_HISTORY_FRAMES; i++) {
            this._addHistoryFrame()
        }
        this._sinceUpdateHistory = 0
        this._externalSetControl = false
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

    _addHistoryFrame(consumption = 0) {
        this.outputHistory.push({
            output: this.output,
            consumption: consumption,
            timeMs: Date.now(),
        })
        while (this.outputHistory.length > REACTOR_HISTORY_FRAMES) {
            this.outputHistory.shift()
        }

    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        if (this._externalSetControl) {
            this._externalSetControl = false
            actionController.setValue(this.id + "_control", this.control)
        }

        if (!this.on) {
            actionController.setValue(this.id + "_control", 0)
        }


        this.control = actionController.getValue(this.id + "_control", 0)

        this._sinceUpdateHistory += deltaMs
        while (this._sinceUpdateHistory >= REACTOR_UPDATE_HISTORY_MS) {
            this._sinceUpdateHistory -= REACTOR_UPDATE_HISTORY_MS
            this._addHistoryFrame(model.sub.powerConsumption)
        }
    }


   toViewState() {
        return {
            ...super.toViewState(),
            fuel: this.fuel,
            control: this.control,
            isReactor: true,
            history: this.outputHistory,
            historyTo: Date.now(),
            historyFrom: Date.now() - HIST_TIME_MS,
            maxOutput: this.maxOutput,
        }
    }
}

////////////////////////////////////////
// CHEATBOX
////////////////////////////////////////


function random(list) {
    return list[Math.floor(Math.random()*list.length)];
}

export class CheatBox extends Subsystem {
    constructor(gridPosition) {
        super(gridPosition, "cheatbox", "Cheatbox", SUBSYSTEM_CATEGORIES.WEAPON)

        this.cheats = [
            action({
                id: "cheat_startSub",
                name: "Start Sub",
                onCompleted: (model) => {
                    model.sub.subsystems.forEach(s => {
                        s.on = true
                        if (s instanceof Reactor) {
                            s.externalSetControl(1)
                        }
                    })
                },
            }),
            action({
                id: "cheat_addstatus",
                name: "Add random status",
                onCompleted: (model) => {
                    const s = random(model.sub.subsystems)
                    s.addSampleStatus()
                },
            }),
        ]

        this.actions.push(...this.cheats)
        this.on = true
    }

    toViewState() {
        return {
            ...super.toViewState(),
            cheats: this.cheats.map(c => c.toViewState()),
            isCheatbox: true,

        }
    }
}

////////////////////////////////////////

export class Engine extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, SUBSYSTEM_CATEGORIES.NAVIGATION, template)
        this.template = template
        this.force = template.force
        this.rotationalForce = template.rotationalForce
        this._subThrottle = 0
    }

    isEngine() {
        return true
    }

    toViewState() {
        return {
            ...super.toViewState(),
        }
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        this._subThrottle = model.sub.throttle
    }

    get nominalPowerConsumption() {
        return 0.1 * this._powerConsumption
    }

    get powerConsumption() {
        return this.on ? Math.abs(this._subThrottle * this._powerConsumption) : 0
    }

    get thrust() {
        return this.on ? this.force : 0
    }

    get rotationalThrust() {
        return this.on ? this.rotationalForce : 0
    }

}

class DirectionAction extends PressAction {
    constructor(id, name, component, icon, key) {
        super({id: id, name: name, icon: icon, key: key, category: ACTION_CATEGORY.DIRECTION})
        this.component = component
    }

    addErrorConditions(c) {
        if (!this.component.on) {
            c.push("Unpowered")
        }
    }
}


export class Steering extends Subsystem {
    constructor(gridPosition, id, name) {
        super(gridPosition, id, name, SUBSYSTEM_CATEGORIES.NAVIGATION, {powerConsumption: 5})

        this._left = new DirectionAction(id + "_left", "Left", this, "fa-solid fa-angle-left", "a")
        this._right = new DirectionAction(id + "_right", "Right", this, "fa-solid fa-angle-right", "d")
        this._forward = new DirectionAction(id + "_forward", "Forward", this, "fa-solid fa-angle-up", "w")
        this._backward = new DirectionAction(id + "_backward", "Backward", this, "fa-solid fa-angle-down", "s")

        this.actions.push(this._left, this._right, this._forward, this._backward)

    }

    get rotationControlOn() {
        return true
    }

    getThrottle() {
        if (!this.on) {
            return 0
        }
        var throttle = 0
        if (this._forward.active) {
            throttle += 1
        }
        if (this._backward.active) {
            throttle -= 0.5
        }
        return throttle
    }

    getDirection() {
        return this.direction
    }

    get direction() {
        if (!this.on) {
            return 0
        }
        var dir = 0
        if (this._left.active) {
            dir -= 1
        }
        if (this._right.active) {
            dir += 1
        }
        return dir
    }

    toViewState() {
        return {
            ...super.toViewState(),
            left: this._left.toViewState(),
            right: this._right.toViewState(),
            forward: this._forward.toViewState(),
            backward: this._backward.toViewState(),
            isSteering: true,
        }
    }
}


////////////////////////////////////////

export class SubStatusScreen extends Subsystem {
    constructor(gridPosition, id, name) {
        super(gridPosition, id, name, SUBSYSTEM_CATEGORIES.STATUS, {powerConsumption: 5})
        this.position = {x: 0, y: 0}
        this.speed = 0
        this.orientation = 0
        this.rotationSpeed = 0
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        this.position = model.sub.body.position
        this.speed = model.sub.body.speed.length()
        this.orientation = model.sub.body.orientation
        this.rotationSpeed = model.sub.body.rotationSpeed
    }

    toViewState() {
        return {
            ...super.toViewState(),
            showsSubStatus: true,
            position: this.position,
            speed: this.speed,
            orientation: this.orientation,
            rotationSpeed: this.rotationSpeed
        }
    }
}

