import { Edge, SimpleRect } from "./physics"

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

const MAP_BUCKET_SIZE = 100

var autoinc = 0

export class BucketMap {

    constructor() {
        this.buckets = {}
    }

    _getBucket(x, y) {
        const key = x + "_" + y
        if (!(key in this.buckets)) {
            this.buckets[key] = []
        }
        return this.buckets[key]
    }

    _combineBuckets(buckets) {
        const seen = {}
        const result = []
        buckets.forEach(b => {
            b.forEach(f => {
                if (!(f.id in seen)) {
                    result.push(f)
                    seen[f.id] = f

                }
            })
        })
        return result
    }

    _bucketsOverlapping(polygon) {
        const result = []
        const box = polygon.simpleBoundingBox
        for (var x = Math.floor(box.x / MAP_BUCKET_SIZE); x <= Math.floor((box.x + box.width) / MAP_BUCKET_SIZE); x++) {
            for (var y = Math.floor(box.y / MAP_BUCKET_SIZE); y <= Math.floor((box.y + box.height) / MAP_BUCKET_SIZE); y++) {
                result.push(this._getBucket(x, y))
            }
        }
        return result
    }

    getFeaturesIntersecting(polygon) {
        return this._combineBuckets(this._bucketsOverlapping(polygon))
    }

    addFeature(polygon, type =MAP_FEATURE_TYPE.DEFAULT) {
        const feature = new MapFeature(("feature" + autoinc++), polygon, type)
        this._bucketsOverlapping(polygon).forEach(b => {
            b.push(feature)
        })
    }

    detectCollision(polygon) {
        let result = null
        this.getFeaturesIntersecting(polygon).forEach(f => {
            if (f.polygon.overlaps(polygon)) {
                result = {
                    mapFeature: f
                }
            }
        })
        return result
    }

    detectWallCollision(polygon) {
        let result = null
        this
            .getFeaturesIntersecting(polygon)
            .filter(f => f.polygon.overlaps(polygon))
            .forEach(f => {
                result = {
                    mapFeature: f,
                    mapFeatureWall: f.polygon.myOverlappingEdge(polygon),
                }
            })
        if (result && !result.mapFeatureWall) {
            // can't debug this
            console.log("DETECT WALL COLLISION DETECTS NO WALLS")
            result.mapFeatureWall = result.mapFeature.polygon.edges[0]
        }
        return result
    }

    raycast(from, to) {
        const box = new SimpleRect(from.x, from.y, to.x - from.x, to.y - from.y)
        const features = this.getFeaturesIntersecting(box)
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

export class LinearMap {
    constructor() {
        this.features = []
    }

    getFeaturesIntersecting(polygon) {
        return this.features
    }

    addFeature(polygon, type =MAP_FEATURE_TYPE.DEFAULT) {
        const feature = new MapFeature(("feature" + autoinc++), polygon, type)
        this.features.push(feature)
    }

    detectCollision(polygon) {
        let result = null
        this.getFeaturesIntersecting(polygon).forEach(f => {
            if (f.polygon.overlaps(polygon) && ( f.polygon.myOverlappingEdge(polygon) != null)) {
                result = {
                    mapFeature: f,
                    mapFeatureWall: f.polygon.myOverlappingEdge(polygon),
                }
            }
        })
        return result
    }

    raycast(from, to) {
        const box = new SimpleRect(from.x, from.y, to.x - from.x, to.y - from.y)
        const features = this.getFeaturesIntersecting(box)
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

