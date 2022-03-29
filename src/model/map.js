import { Edge, Vector, SimpleRect, vectorForPolar } from "./physics"

const MAP_BUCKET_SIZE = 20

class CollisionMap {
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

    getPolygonsIntersecting(polygon) {
        return this._combineBuckets(this._bucketsOverlapping(polygon))
    }

    add(polygon) {
        this._bucketsOverlapping(polygon).forEach(b => {
            b.push(polygon)
        })
    }
}

export class Map {
    constructor() {
        this.polygonDefinitions = []
        this.collisionMaps = {}
        this.caves = []
        this.paths = []
        this._logicalPolygons = null
    }
    // logical map
    getTopLeftCave() {
        return this._getCaveMinimizing(c => c.position.x + c.position.y)
    }

    getTopRightCave() {
        return this._getCaveMinimizing(c => -c.position.x + c.position.y)
    }

    getBottomLeftCave() {
        return this._getCaveMinimizing(c => c.position.x + -c.position.y)
    }

    getBottomRightCave() {
        return this._getCaveMinimizing(c => -c.position.x + -c.position.y)
    }


    _getCaveMinimizing(fun) {
        var dist = Infinity
        var result = null
        this.caves.forEach(c => {
            const myDist = fun(c)
            if (myDist < dist) {
                result = c
                dist = myDist
            }

        })
        return result
    }

    get logicalPolygons() {
        if (this._logicalPolygons === null) {
            this._logicalPolygons = [
                ...this.caves.map(c => c.polygon()),
                ...this.paths.map(c => c.polygon()),
            ]
        }
        return this._logicalPolygons
    }

    // collisions
    _getCollisionMap(deltaSize) {
        const k = "s" + deltaSize
        if (!(k in this.collisionMaps)) {
            this.collisionMaps[k] = this._createCollisionMap(deltaSize)
        }
        return this.collisionMaps[k]
    }

    _createCollisionMap(deltaSize) {
        const result = new CollisionMap()
        this.polygonDefinitions.forEach(d => {
            result.add(d.createPolygon(deltaSize))
        })
        return result
    }

    addObstacle(polygonDefinition) {
        this.polygonDefinitions.push(polygonDefinition)
    }

    getPolygonsIntersecting(polygon, size=0) {
        return this._getCollisionMap(size).getPolygonsIntersecting(polygon)
    }


    detectCollision(polygon, size=0) {
        let result = null
        this._getCollisionMap(size).getPolygonsIntersecting(polygon).forEach(p => {
            if (p.overlaps(polygon)) {
                result = {
                    polygon: p
                }
            }
        })
        return result
    }

    detectWallCollision(polygon, speedVector=null, wallDetection=true, size=0) {
        let result = null
        this
            ._getCollisionMap(size)
            .getPolygonsIntersecting(polygon)
            .filter(p => p.overlaps(polygon))
            .forEach(p => {
                result = {
                    polygon: p,
                    mapFeatureWall: p.myOverlappingEdge(polygon),
                }
                if (speedVector && wallDetection && result.mapFeatureWall) {
                    result.angle = speedVector.theta - result.mapFeatureWall.theta
                    result.impactSpeed = Math.sin(result.angle) * speedVector.length
                    result.impactTheta = (result.mapFeatureWall.theta - Math.PI / 2) % (2 * Math.PI)
                    result.impactForce = vectorForPolar(result.impactSpeed, result.impactTheta).negative()

                    const wallVect = result.mapFeatureWall.toVector()
                    result.wallNormal = null
                    if (result.mapFeatureWall.theta > speedVector.theta) {
                        result.wallNormal = new Vector(wallVect.y, -wallVect.x)
                    } else {
                        result.wallNormal = new Vector(-wallVect.y, wallVect.x)
                    }

                }
            })
        if (result && wallDetection && !result.mapFeatureWall) {
            // can't debug this

            console.log("DETECT WALL COLLISION DETECTS NO WALLS")
            console.trace()
            result.mapFeatureWall = result.polygon.edges[0]
        }
        return result
    }

    raycast(from, to, size=0) {
        const minX = Math.min(from.x, to.x)
        const minY = Math.min(from.y, to.y)
        const maxX = Math.max(from.x, to.x)
        const maxY = Math.max(from.y, to.y)


        const box = new SimpleRect(minX, minY, maxX - minX, maxY - minY)
        const polygons = this._getCollisionMap(size).getPolygonsIntersecting(box)
        const e = new Edge(from, to)
        var result = null
        var minDistance = Infinity
        polygons.forEach(f => {
            f.edges.forEach(fEdge => {
                const intersection = e.intersects(fEdge)
                if (intersection && from.distanceTo(intersection) < minDistance) {
                    const eVect = fEdge.toVector()
                    var normal = null
                    if (eVect.theta > e.theta) {
                        normal = new Vector(eVect.y, -eVect.x)
                    } else {
                        normal = new Vector(-eVect.y, eVect.x)
                    }

                    result = {
                        point: intersection,
                        edge: fEdge,
                        normal: normal
                    }
                    minDistance = from.distanceTo(intersection)
                }
            })
        })
        return result

    }

}
