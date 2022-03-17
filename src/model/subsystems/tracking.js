import { Subsystem, SUBSYSTEM_CATEGORIES } from './index'

export class Tracking extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, SUBSYSTEM_CATEGORIES.STATUS, template)
        this.trackedEntity = null
        this.trackingDetails = null
        this.range = template.range
    }

    getTrackingDetails(entity) {
        return {
            entityId: entity.id,
            position: entity.position,
            orientation: entity.orientation,
            speed: entity.speedVector.length,
            planDescription: entity.planDescription,
            alive: entity.alive,

        }
    }


    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        const sub = model.sub
        if (sub.targetEntity && sub.position.distanceTo(sub.targetEntity.position) <= this.range) {
            sub.trackedEntity = sub.targetEntity
            this.trackingDetails = this.getTrackingDetails(model.sub.targetEntity)
        } else {
            sub.trackedEntity = sub.targetEntity
            this.trackingDetails = null
        }
    }

    toViewState() {
        return {
            ...super.toViewState(),
            tracking: this.trackingDetails,
            showsTracking: true,
        }
    }

}
