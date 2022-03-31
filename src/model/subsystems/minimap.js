import { Subsystem, SUBSYSTEM_CATEGORIES } from "."
import { Polygon, rectangle } from "../physics"
import { Point } from "../physics"

const VIEW_STATE_UPDATE_EVERY = 500

export class Minimap extends Subsystem {
    constructor(gridPosition) {
        super(gridPosition, "minimap", "Minimap", SUBSYSTEM_CATEGORIES.NAVIGATION, {
            takesDamage: false,
            gridSize: new Point(1, 2),
        })

        this.minX = -550
        this.maxX = 550
        this.minY = -550
        this.maxY = 550

        this.on = true

        this._sinceViewStateUpdate = 0
        this._viewState = {}
    }

    updateState(deltaMs, model, ac) {
        super.updateState(deltaMs, model, ac)

        this._sinceViewStateUpdate += deltaMs

        if (this._sinceViewStateUpdate >= VIEW_STATE_UPDATE_EVERY) {
            this._sinceViewStateUpdate = 0
            this._updateViewState(model)
        }
    }

    _updateViewState(model) {
        this._viewState = {
            features: model.map.logicalPolygons,
            minX: this.minX,
            maxX: this.maxX,
            minY: this.minY,
            maxY: this.maxY,
            isMinimap: true,
            position: model.sub.position,
            target: model.target.position,
        }
    }

    toViewState() {
        return {
            ...super.toViewState(),
            ...this._viewState,
        }
    }
}
