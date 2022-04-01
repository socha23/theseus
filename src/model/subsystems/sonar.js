import {ToggleAction } from '../action'
import { Subsystem } from './index'
import {Point, rectangle} from "../physics"

class SonarDebugAction extends ToggleAction {
    constructor(sonar) {
        super({id: sonar.id + "_debug", name: "Toggle debug mode", icon: "fa-solid fa-bug"})
        this.sonar = sonar
    }

    addErrorConditions(c) {
        if (!this.sonar.on) {
            c.push("Unpowered")
        }
    }
}


export const RANGE_CIRCLE_TYPE = {
    HOVER: "hover",
    DISABLED: "disabled",
    DEFAULT: "default",
}

export const AIM_LINE_TYPE = {
    DEFAULT: "default",
    HIT: "hit",
    MISS: "miss",
}

export class RangeCircle {
    constructor(id, range, type=RANGE_CIRCLE_TYPE.DEFAULT) {
        this.id = id
        this.range = range
        this.type = type
    }
}

export class AimLine {
    constructor(id, from, to, type=AIM_LINE_TYPE.DEFAULT) {
        this.id = id
        this.from = from
        this.to = to
    }
}

export class Sonar extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, {
            ...template,
            viewRefreshMs: 30,
        })
        this.range = template.range
        this.debugAction = new SonarDebugAction(this)
        this.actions.push(this.debugAction)
    }

    viewPort(model) {
        return rectangle(model.sub.position, new Point(2 * this.range, 2 * this.range), model.sub.orientation)
    }

    _observeEntities(model) {
        return model.map
            .getEntitiesIntersecting(model.sub.position, this.viewPort(model))

    }

    _observeBlips(model) {
        return this._observeEntities(model)
            .sort((a, b) => a.ordering - b.ordering)
            .map(e => e.toViewState())
    }

    _observeFeatures(model) {
        return model.map.getPolygonsIntersecting(this.viewPort(model))
    }


    createViewState(model) {
        const sub = model.sub
        return {
                isSonar: true,
                range: this.range,
                position: sub.position,
                orientation: sub.orientation,
                blips: this._observeBlips(model),
                trackedBlipId: sub.targetEntity?.id,
                subVolume: sub.body.volume,
                debug: this.debugAction.value,
                ranges: sub.ranges ?? [],
                aimLines: sub.aimLines ?? [],
                features: this._observeFeatures(model) ?? [],
                toggleActions: [this.debugAction.toViewState()],
                hitMarks: sub.hitMarksViewState() ?? [],
                target: model.target,
        }
    }
}


