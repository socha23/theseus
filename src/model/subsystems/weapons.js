import {action } from '../action'
import { Subsystem, SUBSYSTEM_CATEGORIES } from './index'
import { AimLine, AIM_LINE_TYPE, RangeCircle, RANGE_CIRCLE_TYPE } from './sonar'
import { EFFECT_TYPES, shootHit, shootMiss } from '../effects'
import { MATERIALS, MATERIAL_DEFINITIONS } from '../materials'


const DEFAULT_WEAPON_PARAMS = {
    reloadTime: 5000,
    ammoMax: 5,
    powerConsumption: 10,
    range: 20,
}

export class Weapon extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, SUBSYSTEM_CATEGORIES.WEAPON, {...DEFAULT_WEAPON_PARAMS, ...template})
        this.ammo = this.template.ammoMax
        this.ammoMax = this.template.ammoMax
        this.range = this.template.range
        this._target = null
        this._targetDistance = 0
        this._targetVisible = false
        this._mouseOver = false
        this._operator = false
        this._aim = new Aim(this)
        this._shotsLeft = 0
        this._position = null

        this.aimAction = action({
            id: id + "_aim",
            name: "Aim",
            longName: "Aim " + name,
            icon: "fa-solid fa-bullseye",
            isVisible: () => !this._aim._aiming,
            addErrorConditions: c => this._addAimErrors(c),
            onEnterActive: m => {this.aim(m)},
        });

        this.shootAction = action({
            id: id + "_shoot",
            name: "Shoot",
            icon: "fa-solid fa-bullseye",
            isVisible: () => this._aim._aiming,
            addErrorConditions: c => this._addShootErrors(c),
            onCompleted: m => {this.shoot()}

        });

        this.reloadAction = action({
            id: id + "_reload",
            name: "Reload",
            icon: MATERIAL_DEFINITIONS[MATERIALS.KINETIC_AMMO].icon,
            progressTime: template.reloadTime,
            addErrorConditions: c => this._addReloadErrors(c),
            onCompleted: m => {this.ammo = this.template.ammoMax},
            requiresOperator: true,
            requiredMaterials: {
                [MATERIALS.KINETIC_AMMO]: 1
            },
        });

        this.weaponActions = [this.aimAction, this.shootAction, this.reloadAction]

        this.actions.push(...this.weaponActions)

    }

    _addAimErrors(c) {
        if (!this.on) {
            c.push("Unpowered")
        }
        if (this.ammo === 0) {
            c.push("Out of ammo")
        }
        if (!this._target) {
            c.push("No target")
        } else if (!this._targetVisible) {
            c.push("Target obscured")
        } else if (this._target && this.range < this._targetDistance) {
            c.push("Out of range")
        }

    }

    aim(model) {
        this._aim.aim()
        this._shotsLeft = 1
        this._operator = model.sub.operators.assignOperator(this.aimAction)
    }

    onFinishAim(model) {
        this._operator = null
        this._shotsLeft = 0
        model.sub.operators.unassignOperator(this.aimAction)
    }

    _addReloadErrors(c) {
        if (!this.on) {
            c.push("Unpowered")
        }
    }

    _addShootErrors(c) {
        if (!this.on) {
            c.push("Unpowered")
        } else if (this.ammo === 0) {
            c.push("Out of ammo")
        } else if (!this._target) {
            c.push("No target")
        } else if (this._shotsLeft === 0) {
            c.push("Out of shots")
        } else if (!this._targetVisible) {
            c.push("Target obscured")
        } else if (this.range < this._targetDistance) {
            c.push("Out of range")
        }
    }

    shoot() {
        this.ammo = Math.max(0, this.ammo - 1)
        this._shotsLeft -= 1

        const hit = this._aim.shoot()
        this.addEffect(hit.length > 0 ? shootHit() : shootMiss())
        hit.forEach(e => {
            e.onHit()
        })
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        this._position = model.sub.position
        this._target = model.sub.targetEntity
        if (this._target) {
            this._targetDistance = this._target.position.distanceTo(model.sub.position) - this._target.radius
            this._targetVisible = (model.map.raycast(model.sub.position, this._target.position) == null)
        } else {
            this._targetDistance = 0
        }

        this._aim.updateState(deltaMs, model)

        if (this._aim._aiming && !model.sub.operators.hasAssignedOperator(this.aimAction)) {
            this._aim.onFinishAim(model)
            this.aimAction.cancel(model)
        }
        this._mouseOver = actionController.isMouseOverSubsystem(this)
    }

    toViewState() {
        return {
            ...super.toViewState(),
            usesAmmo: true,
            ammo: this.ammo,
            ammoMax: this.ammoMax,
            aim: this._aim.toViewState(),
            isWeapon: true,
            weaponActions: this.weaponActions.filter(a => a.visible).map(a => a.toViewState()),
        }
    }

    get ranges() {
        let rangeType = RANGE_CIRCLE_TYPE.DISABLED
        if (this.on) {
            rangeType = this._mouseOver ? RANGE_CIRCLE_TYPE.HOVER : RANGE_CIRCLE_TYPE.DEFAULT
        }
        return [new RangeCircle(this.id, this.range, rangeType)]
    }

    get aimLines() {
        if  (this._target && this._mouseOver) {
            var type = AIM_LINE_TYPE.DEFAULT
            if (this.hasEffectOfType(EFFECT_TYPES.SHOOT_HIT)) {
                type = AIM_LINE_TYPE.HIT
            }
            if (this.hasEffectOfType(EFFECT_TYPES.SHOOT_MISS)) {
                type = AIM_LINE_TYPE.MISS
            }
            return [new AimLine(this.id + "_aim", this._position, this._target.position, type)]
        } else {
            return []
        }
    }

}


function percentize(val, total) {
    return Math.floor(val / total * 1000) / 10
}

const TARGET_SIZE = 3
const CROSSHAIRS_SIZE = 3
const CROSSHAIRS_SPEED = 15

const SHOOTMARKS_DECAY = 2000

class Aim {
    constructor(weapon) {
        this._weapon = weapon
        this._sonarRange = 1
        this._targetSize = 0

        this._aiming = false
        this._crosshairsPos = 0
        this._shootMarks = []
    }

    updateState(deltaMs, model) {
        this._sonarRange = model.sub.sonarRange

        if (this._weapon._target != null) {
            this._targetSize = this._weapon._target.radius * TARGET_SIZE
        } else {
            this._targetSize = 0
        }

        if (this._aiming) {
            this._crosshairsPos = this._crosshairsPos + CROSSHAIRS_SPEED * deltaMs / 1000
            if (this._crosshairsPos > this._weapon.range) {
                this.onFinishAim(model)
            }
        }

        this._shootMarks = this._shootMarks.filter(s => (Date.now() - s.time) < SHOOTMARKS_DECAY)
    }

    onFinishAim(model) {
        this._aiming = false
        this._crosshairsPos = 0
        this._weapon.onFinishAim(model)
    }

    aim() {
        this._aiming = true
        this._crosshairsPos = 0
    }

    shoot() {
        var hit = false
        if (this._weapon._target) {
            hit = true
            if (
                (this._crosshairsPos + CROSSHAIRS_SIZE < this._weapon._targetDistance)
            || (this._weapon._targetDistance + this._targetSize < this._crosshairsPos)) {
                hit = false
            }
            this._shootMarks.push({
                hit: hit,
                pos: this._crosshairsPos,
                size: CROSSHAIRS_SIZE,
                time: Date.now()
            })
        }
        return hit ? [this._weapon._target] : []
    }

    toViewState() {
        return {
            on: this._weapon.on,
            targetObscured: (this._weapon._target && !this._weapon._targetVisible),
            rangePercent: percentize(this._weapon.range, this._sonarRange),
            target: this._weapon._target ? {
                alive: this._weapon._target.alive,
                distancePercent: percentize(this._weapon._targetDistance, this._sonarRange),
                sizePercent: percentize(this._targetSize, this._sonarRange),
            } : null,
            crosshairs: this._aiming ? {
                distancePercent: percentize(this._crosshairsPos, this._sonarRange),
                sizePercent: percentize(CROSSHAIRS_SIZE, this._sonarRange)
            } : null,
            shootMarks: this._shootMarks.map(m => {
                return {
                    hit: m.hit,
                    distancePercent: percentize(m.pos, this._sonarRange),
                    sizePercent: percentize(m.size, this._sonarRange),
                }
            })

        }
    }
}
