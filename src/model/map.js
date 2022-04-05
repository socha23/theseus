import { transpose } from "../utils"
import { Edge, Vector, SimpleRect, vectorForPolar, Point, rectangle } from "./physics"

const DEFAULT_MAP_BUCKET_SIZE = 10
const ENTITIES_BUCKET_SIZE = 20
const PLANTS_BUCKET_SIZE = 20

const BUCKET_MARGIN = 20

class CollisionMap {
    constructor(from, to, bucketSize = DEFAULT_MAP_BUCKET_SIZE) {
        this.bucketSize = bucketSize

        this.minX = Math.floor(from.x / this.bucketSize) - BUCKET_MARGIN
        this.minY = Math.floor(from.y / this.bucketSize) - BUCKET_MARGIN


        const maxX = Math.floor(to.x / this.bucketSize) + BUCKET_MARGIN
        const maxY = Math.floor(to.y / this.bucketSize) + BUCKET_MARGIN

        this.width = maxX - this.minX + 1
        this.height = maxY - this.minY + 1


        this.buckets = []

        for (var i = 0; i < this.width * this.height; i++) {
            this.buckets.push(new Set)
        }

    }

    _getBucket(x, y) {
        const bucketIdx = (y - this.minY) * this.width + (x - this.minX)
        return this.buckets[bucketIdx]
    }

    _combineBuckets(buckets) {
        const result = new Set()
        buckets.forEach(b => {
            b.forEach(f => {
                result.add(f)
            })
        })
        const res = [...result]
        return res
    }

    _bucketsOverlapping(polygon) {
        const result = []
        const box = polygon.simpleBoundingBox


        for (var x = Math.floor(box.x / this.bucketSize); x <= Math.floor((box.x + box.width) / this.bucketSize); x++) {
            for (var y = Math.floor(box.y / this.bucketSize); y <= Math.floor((box.y + box.height) / this.bucketSize); y++) {
                result.push(this._getBucket(x, y))
            }
        }
        if (result.length == 0) {
            console.trace()
            console.log("NO BUCKETS OVERLAPPING", polygon)
        }
        return result
    }

    getPolygonsIntersecting(polygon) {
        return this._combineBuckets(this._bucketsOverlapping(polygon))
    }

    add(polygon, item=polygon) {
        this._bucketsOverlapping(polygon).forEach(b => {
            b.add(item)
        })
    }

    remove(polygon, item=polygon) {
        this._bucketsOverlapping(polygon).forEach(b => {
            b.delete(item)
        })

    }
}

export class Map {
    constructor(from, to) {
        this.polygonDefinitions = []
        this.collisionMaps = {}
        this.caves = []
        this.paths = []
        this._logicalPolygons = null

        this.plantMap = new CollisionMap(from, to, PLANTS_BUCKET_SIZE)
        this.plants = []

        this.entityMap = new CollisionMap(from, to, ENTITIES_BUCKET_SIZE)
        this.entities = []

        this.from = from
        this.to = to

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

    randomPosition(radius, maxTries = 1000) {
        for (var i = 0; i < maxTries; i++) {
            const x = transpose(Math.random(), 0, 1, this.from.x, this.to.x)
            const y = transpose(Math.random(), 0, 1, this.from.y, this.to.y)
            const p = new Point(x, y)
            if (this.detectCollision(rectangle(p, new Point(2 * radius, 2 * radius)), 0) == null) {
                return p
            }
        }
        throw new Error("Couldn't find random position for radius " + radius)

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
        const result = new CollisionMap(this.from, this.to)
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

    detectWallCollision(polygon, speedVector=null) {
        let result = null
        const polygons = this
            ._getCollisionMap(0)
            .getPolygonsIntersecting(polygon)
            .filter(p => p.overlaps(polygon))

        if (polygons.length > 0) {
            const p = polygons[0]
            var wall = p.myOverlappingEdge(polygon)
            if (wall == null) {
                console.log("Can't find impact wall")
                wall = p.edges[0]
            }

            const wallVect = wall.toVector()
            const angle = speedVector.theta - wall.theta
            const impactSpeed = Math.sin(angle) * speedVector.length
            const impactTheta = (wall.theta - Math.PI / 2) % (2 * Math.PI)
            const impactForce = vectorForPolar(impactSpeed, impactTheta).negative()
            const wallNormal = wall.theta > speedVector.theta ? new Vector(wallVect.y, -wallVect.x) : new Vector(-wallVect.y, wallVect.x)

            result = {
                polygon: p,
                mapFeatureWall: wall,
                wallVect,
                angle,
                impactSpeed: Math.abs(impactSpeed),
                impactTheta,
                impactForce,
                wallNormal
            }
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

    // entities
    addEntity(entity) {
        this.entities.push(entity)
        this.entityMap.add(entity.boundingBox, entity)
    }

    removeEntity(entity) {
        const idx = this.entities.indexOf(entity)
        if (idx >= 0) {
            this.entities.splice(idx, 1)
            this.entityMap.remove(entity.boundingBox, entity)
        }
    }

    updateEntity(entity, previousBoundingBox) {
        if (previousBoundingBox != null) {
            this.entityMap.remove(previousBoundingBox, entity)
            this.entityMap.add(entity.boundingBox, entity)
        }
    }

    getEntitiesIntersecting(polygon) {
        return this.entityMap.getPolygonsIntersecting(polygon)
    }

    getEntitiesAround(pos, radius) {
        const poly = new SimpleRect(pos.x - radius, pos.y - radius, 2 * radius, 2 * radius)
        return this.entityMap.getPolygonsIntersecting(poly)
    }

    // plants - also entities, but different and stored separately
    addPlant(plant) {
        this.plants.push(plant)
        this.plantMap.add(plant.boundingBox, plant)
    }

    getPlantsIntersecting(polygon) {
        return this.plantMap.getPolygonsIntersecting(polygon)
    }



}
