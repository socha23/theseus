import {action } from '../action'
import { Subsystem } from './index'
import { AimLine, AIM_LINE_TYPE, RangeCircle, RANGE_CIRCLE_TYPE } from './sonar'
import { Effect, EFFECT_TYPES, shootHit, shootMiss } from '../effects'
import { MATERIALS, MATERIAL_DEFINITIONS } from '../materials'
import { paramValue } from '../../utils'
import { Point, Vector, vectorForPolar } from '../physics'



export const DAMAGE_TYPES = {
    PIERCING: "piercing"
}

const DEFAULT_WEAPON_PARAMS = {
    reloadTime: 5000,
    ammoMax: 5,
    powerConsumption: 10,
    range: 20,
    damage: {
        type: DAMAGE_TYPES.PIERCING,
        strength: 10,
    },
}

export class Weapon extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, {
            ...DEFAULT_WEAPON_PARAMS,
            ...template,
            viewRefreshMs: 30
        })
        this.ammo = this.template.ammoMax
        this.ammoMax = this.template.ammoMax
        this.range = this.template.range
        this.damage = this.template.damage
        this._target = null
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
            onCompleted: m => {this.shoot(m)}

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
        } else if (this._shotsLeft === 0) {
            c.push("Out of shots")
        }
    }

    shoot(model) {
        this.ammo = Math.max(0, this.ammo - 1)
        this._shotsLeft -= 1

        const hit = this._aim.shoot(model)
        this.addEffect(hit.length > 0 ? shootHit() : shootMiss())
        hit.forEach(e => {
            var hitVector = model.sub.position.vectorTo(e.position)
            hitVector = hitVector.withLength(hitVector.length - e.radius / 2)
            const hitPosition = model.sub.position.plus(hitVector)
            e.onHit({
                ...this.damage,
                strength: paramValue(this.damage.strength),
                position: hitPosition
            })
            model.sub.addEffect(new ProjectileFired(model.sub.position, e.position))
        })

        if (hit.length === 0) {
            model.sub.addEffect(new ProjectileFired(model.sub.position, model.sub.position.plus(vectorForPolar(this.range, Math.random() * 2 * Math.PI))))

        }
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        this._position = model.sub.position
        this._target = model.sub.targetEntity

        this._aim.updateState(deltaMs, model)

        if (this._aim._aiming && !model.sub.operators.hasAssignedOperator(this.aimAction)) {
            this._aim.onFinishAim(model)
            this.aimAction.cancel(model)
        }
        this._mouseOver = actionController.isMouseOverSubsystem(this)
    }

    createViewState(model) {
        return {
            usesAmmo: true,
            ammo: this.ammo,
            ammoMax: this.ammoMax,
            aim: this._aim.createViewState(model),
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
    return Math.floor(val / total * 200) / 2
}

const TARGET_SIZE = 1.5
const CROSSHAIRS_SIZE = 1
const CROSSHAIRS_SPEED = 15

const AIMBAR_MARGIN = 3

class Aim {
    constructor(weapon) {
        this._weapon = weapon
        this._sonarRange = 1

        this._aiming = false
        this._crosshairsPos = 0

        this._targets = []
    }

    updateState(deltaMs, model) {
        this._updateTargets(model)
        if (this._aiming) {
            this._crosshairsPos = this._crosshairsPos + CROSSHAIRS_SPEED * deltaMs / 1000
            if (this._crosshairsPos > this._weapon.range) {
                this.onFinishAim(model)
            }
        }
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

    _updateTargets(model) {
        const myPos = this._weapon._position

        this._sonarRange = model.sub.sonarRange

        this._targets = model.map
            .getEntitiesAround(myPos, this._sonarRange)
            .filter(e => e.position.distanceTo(myPos) <= this._sonarRange + e.radius)
            .filter(e => model.map.raycast(e.position, myPos) == null)
            .map(e => {
                const sizeMultiplier = TARGET_SIZE *  Math.max(0.3, 1 - e.position.distanceTo(myPos) / this._sonarRange)
                return {
                    entity: e,
                    width: e.width * sizeMultiplier,
                    size: e.length * sizeMultiplier,
                    distance: e.position.distanceTo(myPos) - e.radius + AIMBAR_MARGIN,
                    selected: e == model.sub.targetEntity,
                }
            })
        this._targets.sort((a, b) => {
            const score = (t) =>
                (t.selected ? 1000 : 0)
                + (t.size)
            return score(a) - score(b)
        })

    }

    shoot(model) {
        this._targets.forEach(t => {
            t.entity.onHearGunshot()
        })

        var hitTarget = null

        const targets = this._targets
            .filter(t => !t.obscured)
            .filter(t => t.distance < this._crosshairsPos + CROSSHAIRS_SIZE )
            .filter(t => this._crosshairsPos < t.distance + t.size)

        hitTarget = targets.find(t => t.selected)

        if (!hitTarget && targets.length > 0) {
            hitTarget = targets[0]
        }

        return hitTarget ? [hitTarget.entity] : []
    }

    createViewState(model) {
        const myPos = this._weapon._position
        return {
            on: this._weapon.on,
            rangePercent: percentize(this._weapon.range, this._sonarRange),
            targets: this._targets.map(t => ({
                id: t.entity.id,
                alive: t.entity.alive,
                ordering: t.entity.ordering,
                widthPercent: percentize(t.width, this._sonarRange),
                distancePercent: percentize(t.distance, this._sonarRange),
                sizePercent: percentize(t.size, this._sonarRange),
                color: t.entity.color,
                selected: t.selected,
                hitMarks: t.entity.hitMarksViewState(),
            })),
            crosshairs: this._aiming ? {
                distancePercent: percentize(this._crosshairsPos, this._sonarRange),
                sizePercent: percentize(CROSSHAIRS_SIZE, this._sonarRange)
            } : null,
        }
    }
}

export const EFFECT_PROJECTILE = "projectile"

class ProjectileFired extends Effect {
    constructor(from, to, params) {
        super({...params,
            type: EFFECT_PROJECTILE,
            length:2,
            speed:200,
        })
        this.from = from
        this.to = to
        this.distTravelled = 0

        this.pFrom = from
        this.pTo = from
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        const vect = this.from.vectorTo(this.to)

        const dist = vect.length
        this.distTravelled += (deltaMs * this.params.speed * 0.001)

        if (this.distTravelled > dist) {
            this.onCompleted(model)
        } else {
            this.pFrom = this.from.plus(vectorForPolar(this.distTravelled, vect.theta))
            this.pTo = this.from.plus(vectorForPolar(this.distTravelled + this.params.length, vect.theta))
        }
    }

    toViewState() {
        return {
            ...super.toViewState(),
            from: this.pFrom,
            to: this.pTo,
        }
    }
}
