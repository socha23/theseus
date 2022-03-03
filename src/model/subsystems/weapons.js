import {action } from '../action'
import { Subsystem, SUBSYSTEM_CATEGORIES } from '../sub'

export class Weapon extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, SUBSYSTEM_CATEGORIES.WEAPON, template)
        this.template = template
        this.ammo = template.ammoMax
        this.ammoMax = template.ammoMax
        this.shootAction = action({
            id: id + "_shoot",
            name: "Shoot",
            icon: "fa-solid fa-bullseye",
            progressTime: template.aimTime,
            isEnabled: () => {return this.on && this.ammo > 0},
            onCompleted: m => {this.ammo = Math.max(0, this.ammo - 1)}

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

    toViewState() {
        return {
            ...super.toViewState(),
            usesAmmo: true,
            ammo: this.ammo,
            ammoMax: this.ammoMax,
        }
    }
}

