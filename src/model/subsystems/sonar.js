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

const PLANT_UPDATE_MS = 1000

export class Sonar extends Subsystem {
    constructor(gridPosition, id, name, template) {
        super(gridPosition, id, name, {
            ...template,
            viewRefreshMs: 20,
        })
        this.range = template.range
        this.debugAction = new SonarDebugAction(this)
        this.actions.push(this.debugAction)

        this.plants = []
        this._sincePlantUpdate = PLANT_UPDATE_MS
    }

    viewPort(model, margin=0) {
        return rectangle(model.sub.position, new Point(2 * (this.range + margin), 2 * (this.range + margin)), model.sub.orientation)
    }

    _observeBlips(model) {
        const viewPort = this.viewPort(model)
        return model.map.getEntitiesIntersecting(viewPort)
            .filter(e => e.boundingBox.simpleBoundingBox.overlaps(viewPort.simpleBoundingBox))
            .sort((a, b) => a.ordering - b.ordering)
            .map(e => e.toViewState())
    }

    _observePlants(model) {
        const viewPort = this.viewPort(model, 20)
        return model.map.getPlantsIntersecting(viewPort)
            .filter(e => e.boundingBox.simpleBoundingBox.overlaps(viewPort.simpleBoundingBox))
            .sort((a, b) => a.ordering - b.ordering)
            .map(e => e.toViewState())
    }

    _observeFeatures(model) {
        return model.map.getPolygonsIntersecting(this.viewPort(model))
    }

    updateState(deltaMs, model, actionController) {
        super.updateState(deltaMs, model, actionController)
        this._sincePlantUpdate += deltaMs
        if (this._sincePlantUpdate >= PLANT_UPDATE_MS) {
            this.plants = this._observePlants(model)
            this._sincePlantUpdate %= PLANT_UPDATE_MS
        }
    }

    createViewState(model) {
        const sub = model.sub
        return {
                isSonar: true,
                range: this.range,
                position: sub.position,
                orientation: sub.orientation,
                plants: this.plants,
                blips: this._observeBlips(model),
                trackedBlipId: sub.targetEntity?.id,
                subVolume: sub.body.volume,
                debug: this.debugAction.value,
                ranges: sub.ranges ?? [],
                aimLines: sub.aimLines ?? [],
                features: this._observeFeatures(model) ?? [],
                toggleActions: [this.debugAction.toViewState()],
                hitMarks: sub.hitMarksViewState() ?? [],
                projectiles: sub.projectiles.map(p => p.toViewState()),
                target: model.target,
        }
    }
}


