import { Point, Polygon } from "./physics"
import { Map } from "./map"

class PolygonDescription {
    constructor() {

    }

    createPolygon(position, deltaSize = 0) {
        throw new Error("Not implemented")
    }
}

class EllipsoidPolygonDescription extends PolygonDescription {
    constructor(thetas, position, radX=10, radY=radX, resultTheta = 0) {
        super()
        this.thetas = [...thetas]
        this.thetas.sort()
        this.radX = radX
        this.radY = radY
        this.position = position
        this.resultTheta = resultTheta
    }

    createPolygon(deltaSize = 0) {
        const vertices = this.thetas
            .map(theta => new Point((this.radX + deltaSize) * Math.cos(theta), (this.radY + deltaSize) * Math.sin(theta)))
            .map(p => p.rotate(this.resultTheta))
            .map( p => p.plus(this.position))
        return new Polygon(vertices)
    }
}

function ellipsoid(position, radX=10, radY=radX, edgeCount = (radX + radY) / 5) {
    // Pick random points on a (non-rotated) ellipse, rotate, translate.
    // This quarantees a convex polygon.
    edgeCount = Math.max(edgeCount, 5)
    const thetas = []
    for (var i = 0; i < edgeCount; i++) {
        thetas.push(Math.random() * 2 * Math.PI)
    }
    return new EllipsoidPolygonDescription(thetas, position, radX, radY, Math.random() * 2 * Math.PI)
}


const DEFAULT_MAP_PARAMS = {
    position: new Point(0, 0),
    featuresCount: 40,
    featuresSpread: 200,
}

export function getStartingMap(subBoundingBox, params={}) {
    params = {...DEFAULT_MAP_PARAMS, ...params}

    const result = new Map()
    for (var i = 0; i < params.featuresCount; i++) {
        while (true) {

            const position = new Point(
                ((Math.random() * 2) - 1) * params.featuresSpread,
                ((Math.random() * 2) - 1) * params.featuresSpread,
            )
            const width = 10 + Math.random() * 40
            const height = (0.5 + Math.random() * 0.5) * width

            const polyDef = ellipsoid(position, width, height)
            if (!polyDef.createPolygon(0).overlaps(subBoundingBox)) {
                result.add(polyDef)
                break
            }
        }
    }
    return result
}
