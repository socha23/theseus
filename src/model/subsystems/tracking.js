import { Subsystem } from './index'

export class Tracking extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, template)
        this.range = template.range
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
    }

    createViewState(model) {
        const sub = model.sub
        var trackedEntity = null
        if (sub.targetEntity && sub.position.distanceTo(sub.targetEntity.position) <= this.range) {
            trackedEntity = sub.targetEntity?.toViewState()
        } else {
            trackedEntity = null
        }

        return {
            tracking: trackedEntity,
            isTracking: true,
        }
    }

}
