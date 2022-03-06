import {ToggleAction, ACTION_CATEGORY } from '../action'
import { Subsystem, SUBSYSTEM_CATEGORIES } from './index'
import {Point, Volume} from "../physics"

class SonarDebugAction extends ToggleAction {
    constructor(sonar) {
        super({id: sonar.id + "_debug", name: "Debug mode", category: ACTION_CATEGORY.THROTTLE})
        this.sonar = sonar
    }

    get enabled() {
        return this.sonar.on
    }
}


export const RANGE_CIRCLE_TYPE = {
    HOVER: "hover",
    DISABLED: "disabled",
    DEFAULT: "default",
}

export class RangeCircle {
    constructor(id, range, type=RANGE_CIRCLE_TYPE.DEFAULT) {
        this.id = id
        this.range = range
        this.type = type
    }
}

export class Sonar extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, SUBSYSTEM_CATEGORIES.SONAR, template)
        this.position = Point.ZERO
        this.range = template.range
        this.orientation = 0
        this.template = template
        this.subVolume = new Volume(1, 1, 1)
        this.blips = []
        this.sub = null

        this.debugAction = new SonarDebugAction(this)

        this.actions.push(this.debugAction)
    }

    _observeEntities(model) {
        return model.world
            .getEntitiesAround(this.position, this.range * 1.5) // todo range hack to account for square display

    }

    _observeBlips(model) {
        return this._observeEntities(model)
            .map(e => {return {
                id: this.id + "_" + e.id + "_blip",
                color: "red",
                position: e.getPosition(),
                radius: e.getRadius(),
                entityId: e.id,
                entityWidth: e.body.volume.width,
                entityLength: e.body.volume.length,
                entityOrientation: e.body.orientation,
                tracked: e == model.sub.trackedEntity,
                mass: e.mass,
                lastActingForce: e.lastActingForce,
                targetPosition: e.targetPosition,
            }})
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        this.position = model.sub.body.position
        this.orientation = model.sub.body.orientation
        this.subVolume = model.sub.body.volume
        this.blips = this._observeBlips(model)
        this.sub = model.sub
    }

    toViewState() {
        return {
            ...super.toViewState(),
            showsSonar: true,
            range: this.range,
            position: this.position,
            orientation: this.orientation,
            blips: this.blips,
            subVolume: this.subVolume,
            entities: this.entities,
            debug: this.debugAction.value,
            sub: this.sub,
            ranges: this.sub?.ranges ?? [],
        }
    }
}

