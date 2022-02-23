import {Action, ACTION_CATEGORY, RadioAction, ToggleAction } from './action.js'
import {Point, Body, Volume} from './physics.js'
import { Entity } from './entities.js'

export const SUBSYSTEM_CATEGORIES = {
    WEAPON: "WEAPON",
    STATUS: "STATUS",
    NAVIGATION: "NAVIGATION",
}



class Subsystem {
    constructor(id, name, category) {
        this.id = id
        this.name = name
        this.category = category
        this.actions = []
    }

    updateState(deltaMs, model, actionController) {
        this.actions.forEach(a => a.updateState(deltaMs, model, actionController))
    }

    toViewState() {
        return {
            id: this.id,
            name: this.name,
            category: this.category,
            actions: this.actions.map(a => a.toViewState())
        }
    }

    isEngine() {
        return false
    }

}

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
        return this.weapon.ammo > 0
    }
}

export class Weapon extends Subsystem {
    constructor(id, name, template) {
        super(id, name, SUBSYSTEM_CATEGORIES.WEAPON)
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
        super(id, name, SUBSYSTEM_CATEGORIES.NAVIGATION)
        this.template = template
        this.force = template.force
        this.rotationalForce = template.rotationalForce
    }

    isEngine() {
        return true
    }

    toViewState() {
        return {
            ...super.toViewState(),
        }
    }
}

class DirectionAction extends Action {
    constructor(id, name, value, icon, key) {
        super(id, name, ACTION_CATEGORY.DIRECTION, {icon: icon, pressToActivate: true, key: key})
        this.value = value
    }
}


class ThrottleAction extends RadioAction {
    constructor(id, parentId, name, value, icon) {
        super(id, name, ACTION_CATEGORY.THROTTLE, value, {icon: icon}, parentId + "_throttle")
        this.value = value
    }
}

export class Steering extends Subsystem {
    constructor(id, name) {
        super(id, name, SUBSYSTEM_CATEGORIES.NAVIGATION)

        this._dirActions = [
            new DirectionAction(id + "_left", "Left", -1, "fa-solid fa-angle-left", "a"),
            new DirectionAction(id + "_right", "Right", 1, "fa-solid fa-angle-right", "d"),
        ]
        this.actions.push(...this._dirActions)

        this._throttleActions = [
            new ThrottleAction(id + "_1", id, "Full speed ahead", 1, "fa-solid fa-angles-up"),
            new ThrottleAction(id + "_05", id, "Half power", 0.5, "fa-solid fa-angle-up"),
            new ThrottleAction(id + "_0", id, "Stop", 0, "fa-solid fa-ban"),
            new ThrottleAction(id + "_rev", id, "Reverse", -0.3, "fa-solid fa-angle-down"),
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
        super(id, name, SUBSYSTEM_CATEGORIES.STATUS)
        this.position = {x: 0, y: 0}
        this.speed = 0
        this.orientation = 0
        this.rotationSpeed = 0
    }

    updateState(deltaMs, model, actionController) {
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

export class Sonar extends Subsystem {
    constructor(id, name, template) {
        super(id, name, SUBSYSTEM_CATEGORIES.STATUS)
        this.position = Point.ZERO
        this.range = template.range
        this.orientation = 0
        this.template = template
        this.subVolume = new Volume(1, 1, 1)
        this.blips = []
        this.entities = []
        this.sub = null

        this.debugAction = new ToggleAction(id + "_debug", "Debug mode", ACTION_CATEGORY.THROTTLE)
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
            }})
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        this.position = model.sub.body.position
        this.orientation = model.sub.body.orientation
        this.subVolume = model.sub.body.volume
        this.blips = this._observeBlips(model)
        this.entities = this._observeEntities(model)
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

        this._engine = this._findSubsystem(Engine)
        this._steering = this._findSubsystem(Steering)
    }

    updateState(deltaMs, model, actionController) {
        this.subsystems.forEach(s => s.updateState(deltaMs, model, actionController))
        this._updatePosition(deltaMs)
    }

    _updatePosition(deltaMs) {
        var force = 0
        var rotationalForce = 0
        this.subsystems
            .filter(s => s.isEngine())
            .forEach(e => {
                force += e.force
                rotationalForce += e.rotationalForce
            })
        this.body.updateState(deltaMs,
            this.body.dorsalThrustVector(force * this._steering.getThrottle()),
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
