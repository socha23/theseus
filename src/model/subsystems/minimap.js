import { Subsystem, SUBSYSTEM_CATEGORIES } from "."
import { Polygon, rectangle } from "../physics"
import { Point } from "../physics"

export class Minimap extends Subsystem {
    constructor(gridPosition) {
        super(gridPosition, "minimap", "Minimap", SUBSYSTEM_CATEGORIES.NAVIGATION, {
            takesDamage: false,
            gridSize: new Point(1, 2),
        })

        this.minX = -500
        this.maxX = 500
        this.minY = -500
        this.maxY = 500


        this._viewport = new Polygon([
            new Point(this.minX, this.minY),
            new Point(this.maxX, this.minY),
            new Point(this.maxX, this.maxY),
            new Point(this.minX, this.maxY),
        ])
        this._features = null
        this._position = Point.ZERO
        this.on = true
    }

    updateState(deltaMs, model, ac) {
        super.updateState(deltaMs, model, ac)
        this._position = model.sub.position
        if (!this._features) {
            this._features = model.map.getFeaturesIntersecting(this._viewport)
        }

    }

    toViewState() {
        return {
            ...super.toViewState(),
            features: this._features ?? [],
            minX: this.minX,
            maxX: this.maxX,
            minY: this.minY,
            maxY: this.maxY,
            isMinimap: true,
            position: this._position,
        }
    }
}
