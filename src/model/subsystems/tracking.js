import { Subsystem, SUBSYSTEM_CATEGORIES } from './index'

export class Tracking extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, SUBSYSTEM_CATEGORIES.STATUS, template)
        this.trackedEntity = null
        this.range = template.range
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        const sub = model.sub
        if (sub.targetEntity && sub.position.distanceTo(sub.targetEntity.position) <= this.range) {
            this.trackedEntity = sub.targetEntity
        } else {
            this.trackedEntity = null
        }
    }

    toViewState() {
        return {
            ...super.toViewState(),
            tracking: this.trackedEntity?.toViewState() ?? null,
            isTracking: true,
        }
    }

}
