import { MATERIALS, MATERIAL_DEFINITIONS } from '../materials'
import { Subsystem } from './index'


export class Storage extends Subsystem {
    constructor(gridPosition, id, name, startingInventory = {}) {
        super(gridPosition, id, name, {powerConsumption: 0, takesDamage: false, waterResistant: true})
        this.inventory = startingInventory

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
            .forEach(id => {
                result.push({
                    materialId: id,
                    count: this.getCount(id)
                })
            })
        return result
    }

    createViewState(model) {
        return {
            isStorage: true,
            inventoryCounts: this.getCounts()
        }
    }
}
