import { Subsystem } from './index'

////////////////////////////////////////

export class SubStatusScreen extends Subsystem {
    constructor(gridPosition, id, name) {
        super(gridPosition, id, name, {powerConsumption: 0, takesDamage: false})
        this.on = true
    }

    createViewState(model) {
        return {
            showsSubStatus: true,
            position: model.sub.body.position,
            speed: model.sub.body.speed.length,
            orientation: model.sub.body.orientation,
            rotationSpeed: model.sub.body.rotationSpeed,
        }
    }
}

