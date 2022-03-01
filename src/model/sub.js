import {Action, ACTION_CATEGORY, RadioAction, ToggleAction } from './action.js'
import {Point, Body, Volume} from './physics.js'
import { Entity } from './entities.js'

export const SUBSYSTEM_CATEGORIES = {
    WEAPON: "WEAPON",
    STATUS: "STATUS",
    NAVIGATION: "NAVIGATION",
    SONAR: "SONAR",

}

const DEFAULT_TEMPLATE = {
    powerConsumption: 0,
}


class TogglePowerAction extends ToggleAction {
    constructor(subsystem) {
        super(subsystem.id + "_on",
            "Toggle power",
            ACTION_CATEGORY.SPECIAL,
            {icon: "fa-solid fa-power-off"},
            false,
        )
        this._enabled = false
        this._subsystem = subsystem
    }

    isEnabled() {
        return this._enabled
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        if (this._subsystem.on) {
            this._enabled = true
        } else {
            this._enabled = (model.sub.powerBalance >= this._subsystem.nominalPowerConsumption)
        }
    }
}

class Subsystem {
    constructor(id, name, category, template={}) {
        template={...DEFAULT_TEMPLATE, ...template}
        this.id = id
        this.name = name
        this.category = category
        this.actions = []
        this._powerConsumption = template.powerConsumption

        this._actionOn = new TogglePowerAction(this)
        this.actions.push(this._actionOn)

        this._shutdown = false
    }

    updateState(deltaMs, model, actionController) {
        this.actions.forEach(a => a.updateState(deltaMs, model, actionController))
        this._shutdown = false
    }

    toViewState() {
        return {
            id: this.id,
            name: this.name,
            category: this.category,
            actions: this.actions.map(a => a.toViewState()),
            actionOn: this._actionOn.toViewState(),
            on: this.on,
            shutdown: this._shutdown,
        }
    }

    isEngine() {
        return false
    }

    isTracking() {
        return false
    }

    shutdown() {
        this.on = false
        this._shutdown = true
    }

    get nominalPowerConsumption() {
        return this._powerConsumption
    }

    get powerConsumption() {
        return this.on ? this._powerConsumption : 0
    }

    get powerGeneration() {
        return 0
    }

    get on() {
        return this._actionOn.value
    }

    set on(value) {
        this._actionOn.value  = value
    }


}

////////////////////////////////////////

const REACTOR_UPDATE_HISTORY_MS = 200
const REACTOR_HISTORY_FRAMES = 100

const HIST_TIME_MS = REACTOR_HISTORY_FRAMES * REACTOR_UPDATE_HISTORY_MS;

export class Reactor extends Subsystem {
    constructor(id, name, template) {
        super(id, name, SUBSYSTEM_CATEGORIES.NAVIGATION)

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
    }

    get output() {
        return this.maxOutput * this.control
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
// WEAPONS
////////////////////////////////////////

class ReloadAction extends Action {
    constructor(weapon) {
        super(weapon.id + "_reload", "Reload", ACTION_CATEGORY.STANDARD,
            {
                progressMax: weapon.template.reloadTime,
                progressDecay: weapon.template.reloadDecay,
                icon: "fa-solid fa-repeat",

            })
        this.weapon = weapon
    }

    isEnabled() {
        return this.weapon.on
    }

    onCompleted() {
        this.weapon.ammo =this.weapon.template.ammoMax
    }
}


class ShootAction extends Action {
    constructor(weapon) {
        super(weapon.id + "_shoot", "Shoot", ACTION_CATEGORY.STANDARD,
           {
               progressMax: weapon.template.aimTime,
               progressDecay: weapon.template.aimDecay,
               icon: "fa-solid fa-bullseye",
            })
        this.weapon = weapon
    }

    onCompleted() {
        this.weapon.ammo = Math.max(0, this.weapon.ammo - 1)
    }

    isEnabled() {
        return this.weapon.on && this.weapon.ammo > 0
    }
}

export class Weapon extends Subsystem {
    constructor(id, name, template) {
        super(id, name, SUBSYSTEM_CATEGORIES.WEAPON, template)
        this.template = template
        this.ammo = template.ammoMax
        this.ammoMax = template.ammoMax
        this.shootAction = new ShootAction(this)
        this.actions.push(this.shootAction)
        this.reloadAction = new ReloadAction(this)
        this.actions.push(this.reloadAction)
    }

    toViewState() {
        return {
            ...super.toViewState(),
            usesAmmo: true,
            ammo: this.ammo,
            ammoMax: this.ammoMax,
        }
    }
}

////////////////////////////////////////

export class Engine extends Subsystem {
    constructor(id, name, template) {
        super(id, name, SUBSYSTEM_CATEGORIES.NAVIGATION, template)
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
        return this.on ? this._subThrottle * this.force : 0
    }

    get rotationalThrust() {
        return this.on ? this.rotationalForce : 0
    }

}

class DirectionAction extends Action {
    constructor(id, name, component, value, icon, key) {
        super(id, name, ACTION_CATEGORY.DIRECTION, {icon: icon, pressToActivate: true, key: key})
        this.value = value
        this.component = component
    }

    isEnabled() {
        return this.component.on
    }
}


class ThrottleAction extends RadioAction {
    constructor(id, parentId, name, component, value, icon) {
        super(id, name, ACTION_CATEGORY.THROTTLE, value, {icon: icon}, parentId + "_throttle")
        this.value = value
        this.component = component
    }

    isEnabled() {
        return this.component.on
    }
}

export class Steering extends Subsystem {
    constructor(id, name) {
        super(id, name, SUBSYSTEM_CATEGORIES.NAVIGATION, {powerConsumption: 5})

        this._dirActions = [
            new DirectionAction(id + "_left", "Left", this, -1, "fa-solid fa-angle-left", "a"),
            new DirectionAction(id + "_right", "Right", this, 1, "fa-solid fa-angle-right", "d"),
        ]
        this.actions.push(...this._dirActions)

        this._throttleActions = [
            new ThrottleAction(id + "_1", id, "Full speed ahead", this, 1, "fa-solid fa-angles-up"),
            new ThrottleAction(id + "_05", id, "Half power", this, 0.5, "fa-solid fa-angle-up"),
            new ThrottleAction(id + "_0", id, "Stop", this, 0, "fa-solid fa-ban"),
            new ThrottleAction(id + "_rev", id, "Reverse", this, -0.3, "fa-solid fa-angle-down"),
        ]
        this.actions.push(...this._throttleActions)

    }

    getThrottle() {
        var throttle = 0
        this._throttleActions.forEach(a => {
            if (a.isSelected()) {
                throttle += a.value
            }
        })
        return throttle
    }


    getDirection() {
        if (!this.on) {
            return 0
        }
        var dir = 0
        this._dirActions.forEach(a => {
            if (a.isActive()) {
                dir += a.value
            }
        })
        return dir
    }

    toViewState() {
        return {
            ...super.toViewState(),
        }
    }
}


////////////////////////////////////////

export class SubStatusScreen extends Subsystem {
    constructor(id, name) {
        super(id, name, SUBSYSTEM_CATEGORIES.STATUS, {powerConsumption: 5})
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

////////////////////////////////////////

export class Tracking extends Subsystem {
    constructor(id, name) {
        super(id, name, SUBSYSTEM_CATEGORIES.STATUS, {powerConsumption: 5})
        this.trackingDetails = null
    }

    getTrackingDetails(entity) {
        return {
            entityId: entity.id,
            position: entity.getPosition(),
            orientation: entity.getOrientation(),
            speed: entity.speedVector.length(),
            planDescription: entity.planDescription,

        }
    }


    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        if (model.sub.targetEntity) {
            this.trackingDetails = this.getTrackingDetails(model.sub.targetEntity)
        } else {
            this.trackingDetails = null
        }
    }

    toViewState() {
        return {
            ...super.toViewState(),
            tracking: this.trackingDetails,
            showsTracking: true,
        }
    }

}

////////////////////////////////////////

export class Sonar extends Subsystem {
    constructor(id, name, template) {
        super(id, name, SUBSYSTEM_CATEGORIES.SONAR, template)
        this.position = Point.ZERO
        this.range = template.range
        this.orientation = 0
        this.template = template
        this.subVolume = new Volume(1, 1, 1)
        this.blips = []
        this.sub = null

        this.debugAction = new ToggleAction(id + "_debug", "Debug mode", ACTION_CATEGORY.THROTTLE)
        this.debugAction.isEnabled = () => this.on


        this.actions.push(this.debugAction)
    }

    _observeEntities(model) {
        return model.world
            .getEntitiesAround(this.position, this.range * 1.5) // todo range hack to account for square display

    }

    _observeBlips(model) {
        return this._observeEntities(model)
            .map(e => {return {
                id: this.id + "_" + e.id + "_blip",
                color: "red",
                position: e.getPosition(),
                radius: e.getRadius(),
                entityId: e.id,
                entityWidth: e.body.volume.width,
                entityLength: e.body.volume.length,
                entityOrientation: e.body.orientation,
                targetted: e == model.sub.targetEntity,
                mass: e.mass,
                lastActingForce: e.lastActingForce,
                targetPosition: e.targetPosition,
            }})
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        this.position = model.sub.body.position
        this.orientation = model.sub.body.orientation
        this.subVolume = model.sub.body.volume
        this.blips = this._observeBlips(model)
        this.sub = model.sub
    }

    toViewState() {
        return {
            ...super.toViewState(),
            showsSonar: true,
            range: this.range,
            position: this.position,
            orientation: this.orientation,
            blips: this.blips,
            subVolume: this.subVolume,
            entities: this.entities,
            debug: this.debugAction.value,
            sub: this.sub,
        }
    }
}


////////////////////////////////////////

export class Sub extends Entity {
    constructor(volume, subsystems = []) {
        super("sub", new Body(new Point(0, 0), volume, Math.PI / 2))
        this.subsystems = subsystems

        this.targetEntity = null

        this._engine = this._findSubsystem(Engine)
        this._steering = this._findSubsystem(Steering)
    }

    updateState(deltaMs, model, actionController) {
        if (actionController.targetEntityId != null) {
            this.targetEntity = model.world.getEntity(actionController.targetEntityId)
        }
        this.subsystems.forEach(s => s.updateState(deltaMs, model, actionController))
        if (this.powerBalance < 0) {
            this._emergencyShutdown()
        }
        this._updatePosition(deltaMs)
    }

    _emergencyShutdown() {
        const shutdownOrder = [...this.subsystems].sort(
            (a, b) => b.powerConsumption - a.powerConsumption
            )
        while (this.powerBalance < 0 && shutdownOrder.length > 0) {
            const s = shutdownOrder.shift()
            s.shutdown()
        }
    }

    get throttle() {
        return  this._steering.getThrottle()
    }

    get powerConsumption() {
        var result = 0
        this.subsystems.forEach(s => {result += s.powerConsumption})
        return result
    }

    get powerGeneration() {
        var result = 0
        this.subsystems.forEach(s => {result += s.powerGeneration})
        return result
    }

    get powerBalance() {
        return this.powerGeneration - this.powerConsumption
    }

    _updatePosition(deltaMs) {
        var force = 0
        var rotationalForce = 0
        this.subsystems
            .filter(s => s.isEngine())
            .forEach(e => {
                force += e.thrust
                rotationalForce += e.rotationalThrust
            })
        this.body.updateState(deltaMs,
            this.body.dorsalThrustVector(force * this.throttle),
            rotationalForce * this._steering.getDirection()
            )
    }

    _findSubsystem(clazz) {
        return this.subsystems.find(s => s instanceof clazz)
    }

    toViewState() {
        return {
            subsystems: this.subsystems.map(s => s.toViewState()),
            position: this.body.position,
        }
    }


}
