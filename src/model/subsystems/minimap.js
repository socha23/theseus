import { Subsystem } from "."
import { Point } from "../physics"

const VIEW_STATE_UPDATE_EVERY = 500

export class Minimap extends Subsystem {
    constructor(gridPosition) {
        super(gridPosition, "minimap", "Minimap", {
            takesDamage: false,
            gridSize: new Point(1, 2),
            viewRefreshMs: VIEW_STATE_UPDATE_EVERY,
        })

        this.minX = -550
        this.maxX = 550
        this.minY = -550
        this.maxY = 550

        this.on = true
    }

    createViewState(model) {
        return {
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
}
