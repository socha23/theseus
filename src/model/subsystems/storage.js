import { MATERIALS, MATERIAL_DEFINITIONS } from '../materials'
import { Subsystem, SUBSYSTEM_CATEGORIES } from './index'


export class Storage extends Subsystem {
    constructor(gridPosition, id, name, startingInventory = {}) {
        super(gridPosition, id, name, SUBSYSTEM_CATEGORIES.DEFAULT, {powerConsumption: 0})
        this.inventory = startingInventory
        this._interestingMaterials = {}

    }

    getCount(materialId) {
        return this.inventory[materialId] || 0
    }

    put(materialId, howMany = 1) {
        this.inventory[materialId] = Math.min(
            MATERIAL_DEFINITIONS[materialId].storageLimit,
            this.getCount(materialId) + howMany
        )
    }

    take(materialId, howMany = 1) {
        if (this.getCount(materialId) >= howMany) {
            this.inventory[materialId] -= howMany
            return true
        } else {
            return false
        }
    }

    getCounts() {
        const result = []
        Object.values(MATERIALS)
            .filter(id => id in this._interestingMaterials)
            .forEach(id => {
                result.push({
                    materialId: id,
                    count: this.getCount(id)
                })
            })
        return result
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        this._interestingMaterials = model.sub.getInterestingMaterials()
    }

    toViewState() {
        const res = super.toViewState()
        res.inventoryCounts = this.getCounts()
        return res
    }
}
