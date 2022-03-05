import {action } from '../action'
import { Subsystem, SUBSYSTEM_CATEGORIES } from './index'

export class Weapon extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, SUBSYSTEM_CATEGORIES.WEAPON, template)
        this.template = template
        this.ammo = template.ammoMax
        this.ammoMax = template.ammoMax
        this._aim = null
        this._target = null

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
        return this.on && this.ammo > 0 && this._aim == null && this._target != null
    }
    _startAim() {
        this._aim = new Aiming({
            onCompleted: () => {this._aim = null}
        })
        this._aim.addTarget(this._target)
        this._aim.start()
    }

    _canShoot() {
        return this.on && (this.ammo > 0) && (this._aim && this._aim.canShoot())
    }

    _shoot() {
        this.ammo = Math.max(0, this.ammo - 1)
        if (this._aim) {
            const hit = this._aim.shoot()
            hit.forEach(e => {
                e.onHit()
            })
        }
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        this._target = model.sub.trackedEntity
        if (this._aim) {
            this._aim.updateState(deltaMs)
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
