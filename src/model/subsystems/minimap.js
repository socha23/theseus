import { Subsystem, SUBSYSTEM_CATEGORIES } from "."
import { Polygon, rectangle } from "../physics"
import { Point } from "../physics"

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


        this._viewport = new Polygon([
            new Point(this.minX, this.minY),
            new Point(this.maxX, this.minY),
            new Point(this.maxX, this.maxY),
            new Point(this.minX, this.maxY),
        ])
        this._features = null
        this._position = Point.ZERO
        this._target = Point.ZERO
        this.on = true
    }

    updateState(deltaMs, model, ac) {
        super.updateState(deltaMs, model, ac)
        this._position = model.sub.position
        this._target = model.target.position
        if (!this._features) {
            this._features = model.map.logicalPolygons
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
            target: this._target,
        }
    }
}
