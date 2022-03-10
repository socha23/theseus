import { Edge, Point } from "./physics"

export const MAP_FEATURE_TYPE = {
    DEFAULT: "default",
}

export class MapFeature {
    constructor(id, polygon, type=MAP_FEATURE_TYPE.DEFAULT) {
        this.id = id
        this.polygon = polygon
        this.type = type
    }

    get edges() {
        return this.polygon.edges
    }
}

export class Map {

    static autoinc = 0

    constructor() {
        this.features = []
    }

    getFeaturesIntersecting(polygon) {
        return this.features
    }

    addFeature(polygon, type =MAP_FEATURE_TYPE.DEFAULT) {
        this.features.push(new MapFeature(("feature" + Map.autoinc++), polygon, type))
    }

    detectCollision(polygon) {
        let result = null
        this.features.forEach(f => {
            if (f.polygon.overlaps(polygon)) {
                result = {
                    mapFeature: f,
                    mapFeatureWall: f.polygon.myOverlappingEdge(polygon),
                }
            }
        })
        return result
    }

    raycast(from, to) {
        const features = this.features // possible optimization not to raycast against everything
        const e = new Edge(from, to)
        var result = null
        var minDistance = Infinity
        features.forEach(f => {
            f.edges.forEach(fEdge => {
                const intersection = e.intersects(fEdge)
                if (intersection && from.distanceTo(intersection) < minDistance) {
                    result = intersection
                    minDistance = from.distanceTo(intersection)
                }
            })
        })
        return result

    }



}

