import {ToggleAction } from '../action'
import { Subsystem, SUBSYSTEM_CATEGORIES } from './index'
import {Point, rectangle, Volume} from "../physics"
import { shootMiss } from '../effects'

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

const UPDATE_MS = 30

export class Sonar extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, SUBSYSTEM_CATEGORIES.SONAR, template)
        this.range = template.range

        this._sinceLastUpdate = UPDATE_MS
        this.debugAction = new SonarDebugAction(this)
        this.actions.push(this.debugAction)

        this._sinceLastUpdate = 0
        this._viewState = {}
    }

    _observeEntities(model) {
        return model.map
            .getEntitiesAround(model.sub.position, this.range * 1.5) // todo range hack to account for square display

    }

    _observeBlips(model) {
        return this._observeEntities(model)
            .sort((a, b) => a.ordering - b.ordering)
            .map(e => e.toViewState())
    }

    _observeFeatures(model) {
        const viewPort = rectangle(model.sub.position, new Point(3 * this.range, 3 * this.range)) // 3 is a range hack as above
        const features = model.map.getPolygonsIntersecting(viewPort)
        return features
    }


    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)

        if (this._sinceLastUpdate >= UPDATE_MS) {
            this._sinceLastUpdate = this._sinceLastUpdate % UPDATE_MS

            const sub = model.sub

            this._viewState = {
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
                sub: model.sub,
                toggleActions: [this.debugAction.toViewState()],
                hitMarks: sub.hitMarksViewState() ?? [],
                target: model.target,
            }

        } else {
            this._sinceLastUpdate += deltaMs
        }

    }

    toViewState() {
        return {
            ...super.toViewState(),
            ...this._viewState,

        }
    }
}


