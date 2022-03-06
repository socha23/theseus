import {action } from '../action'
import { Subsystem, SUBSYSTEM_CATEGORIES } from './index'
import { RangeCircle, RANGE_CIRCLE_TYPE } from './sonar'
import { EFFECT_TYPES } from '../effects'


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
        this._aim = null
        this._target = null
        this._targetDistance = 0
        this._mouseOver = false

        this.aimAction = action({
            id: id + "_aim",
            name: "Aim",
            icon: "fa-solid fa-bullseye",
            isVisible: () => this._aim == null,
            isEnabled: () => this._canAim(),
            onCompleted: m => {this._startAim()}

        });
        this.actions.push(this.aimAction)

        this.shootAction = action({
            id: id + "_shoot",
            name: "Shoot",
            icon: "fa-solid fa-bullseye",
            isVisible: () => this._aim != null,
            isEnabled: () => this._canShoot(),
            onCompleted: m => {this._shoot()}

        });
        this.actions.push(this.shootAction)


        this.reloadAction = action({
            id: id + "_reload",
            name: "Reload",
            icon: "fa-solid fa-repeat",
            progressTime: template.reloadTime,
            isEnabled: () => {return this.on},
            onCompleted: m => {this.ammo = this.template.ammoMax}
        });
        this.actions.push(this.reloadAction)

    }

    _canAim() {
        return this._aim == null
            && this._target != null
            && this._canContinueAim()
    }

    _canContinueAim() {
        return this.on
            && this.ammo > 0
            && this._targetDistance <= this.range
    }


    _startAim() {
        this._aim = new Aiming({
            onCompleted: () => {this._aim = null}
        })
        this._aim.addTarget(this._target)
        this._aim.start()
    }

    _canShoot() {
        return this.on
            && (this.ammo > 0)
            && (this._aim
            && this._aim.canShoot())
            && this._targetDistance <= this.range

    }

    _shoot() {
        this.ammo = Math.max(0, this.ammo - 1)
        if (this._aim) {
            const hit = this._aim.shoot()
            this.addEffect(hit.length > 0 ? EFFECT_TYPES.SHOOT_HIT : EFFECT_TYPES.SHOOT_MISS, 500)
            hit.forEach(e => {
                e.onHit()
            })
        }
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        this._mouseOver = actionController.isMouseOver(this)
        this._target = model.sub.trackedEntity

        if (this._target) {
            this._targetDistance = this._target.position.distanceTo(model.sub.position)
        } else {
            this._targetDistance = 0
        }
        if (this._aim) {
            if (this._canContinueAim()) {
                this._aim.updateState(deltaMs)
            } else {
                this._aim = null
            }
        }
    }

    toViewState() {
        return {
            ...super.toViewState(),
            usesAmmo: true,
            ammo: this.ammo,
            ammoMax: this.ammoMax,
            aim: (this._aim ? this._aim.toViewState() : null),
            isWeapon: true,
        }
    }

    get ranges() {
        let rangeType = RANGE_CIRCLE_TYPE.DISABLED
        if (this.on) {
            rangeType = this._mouseOver ? RANGE_CIRCLE_TYPE.HOVER : RANGE_CIRCLE_TYPE.DEFAULT
        }
        return [new RangeCircle(this.id, this.range, rangeType)]
    }

}


const DEFAULT_AIM_PARAMS = {
    onHit: (e) => {},
    onCompleted: () => {},
    aimTime: 1500,
    crosshairsSize: 50,
    shootCount: 1,
}

class Aiming {
    constructor(params = {}) {
        this.params = {...DEFAULT_AIM_PARAMS, ...params}
        this._progress = 0
        this._started = false
        this._completed = false
        this._shootCount = this.params.shootCount
        this._targets = []
        this._shootMarks = []
        this._lastProgress = 0
    }


    inProgress() {
        return this._started && !this._completed
    }

    start() {
        if (this.inProgress()) {
            return
        }
        this._progress = 0
        this._started = true
        this._completed = false
    }

    canShoot() {
        return this._shootCount > 0
    }

    shoot() {
        if (!this.inProgress() || this._shootCount <= 0) {
            return [];
        } else {
            this._shootCount--
            const hits = []
            this._targets.forEach(t => {
                const aF = this._progress - this._lastProgress
                const aT = aF + this.params.crosshairsSize
                const bF = t.position
                const bT = aT + t.size

                const hit = (
                    (aF <= bF && bF <= aT)
                    || (bF <= aF && aF <= bT)
                )
                this._shootMarks.push({position: aF, size: this.params.crosshairsSize, hit: hit, id: "sm" + this._progress})
                if (hit) {
                    hits.push(t.entity)
                }
            })
            return hits;
        }
    }

    addTarget(entity) {
        const targetSize = 100
        const posFrom = Math.min(400, this.params.aimTime * 0.5)
        const posTo = this.params.aimTime - targetSize
        const targetPos = Math.random() * (posTo - posFrom) + posFrom

        this._targets.push({
            entity: entity,
            position: targetPos,
            size: targetSize,
            entity: entity,
        })
    }

    _onCompleted() {
        this._started = false
        this._completed = true
        this.params.onCompleted()
    }

    updateState(deltaMs) {
        if (!this.inProgress()) {
            return
        }
        this._progress = Math.min(this._progress + deltaMs, this.params.aimTime)
        this._lastProgress = deltaMs

        if (this._progress >= this.params.aimTime) {
            this._onCompleted()
        }
    }

    toViewState() {
        return {
            progress: this._progress,
            progressMax: this.params.aimTime,
            crosshairsSize: this.params.crosshairsSize,
            targets: this._targets.map(t => ({
                id: t.entity.id,
                position: t.position,
                size: t.size,
            })),
            shootMarks: this._shootMarks,
        }
    }

}
