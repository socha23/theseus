import { Point, Polygon } from "./physics"
import { Map } from "./map"
import { randomElem, transpose } from "../utils"

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

class BoxPolygonDescription extends PolygonDescription {
    constructor(position, width=10, height=width, theta=0) {
        super()
        this.width = width
        this.height = height
        this.position = position
        this.theta = theta
    }

    createPolygon(deltaSize = 0) {
        const dX = (this.width / 2) + deltaSize
        const dY = (this.height / 2) + deltaSize

        const points = [
            new Point(dX, dY),
            new Point(dX, -dY),
            new Point(-dX, -dY),
            new Point(-dX, dY),
        ]

        return new Polygon(points
            .map(p => p.rotate(this.theta))
            .map( p => p.plus(this.position))
        )
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

function boxoid(position, size=10, additionalCorners = 0, theta=0) {
    const thetas = [
        Math.PI / 4,
        3 * Math.PI / 4,
        5 * Math.PI / 4,
        7 * Math.PI / 4,
    ]
    for (var i = 0; i < additionalCorners; i++) {
        thetas.push(Math.random() * 2 * Math.PI)
    }
    const radius = (size * Math.SQRT2 / 2) + 0.2 // 0.2 so it overlaps better
    return new EllipsoidPolygonDescription(thetas, position, radius, radius, theta)
}






const DEFAULT_MAP_PARAMS = {
    position: new Point(0, 0),

    minX: -500,
    maxX: 500,
    minY: -500,
    maxY: 500,

    wallMargin: 20,
    boxSize: 10,
    boxAdditionalCorners: 8,

    caveCorners: 8,
    caveSizeMin: 5,
    caveSizeMax: 90,
    caveMinDistance: 30,
    caveCount: 50,

    pathWidthMin: 15,
    pathWidthMax: 50,
}








var autoinc = 0


class Cave {
    constructor(position, size, definition) {
        this.id = "cave" + autoinc++
        this.position = position
        this.size = size
        this.definition = definition
    }

    polygon(size = 0) {
        return this.definition.createPolygon(size)
    }

    isWithinRange(otherCave, range) {
        return this.polygon(range).overlaps(otherCave.polygon())
    }

    distanceTo(otherCave) {
        return this.position.distanceTo(otherCave.position) - this.size - otherCave.size
    }
}

function randomCave(params, position = null) {
    const minX = params.minX + params.wallMargin + params.caveSizeMax / 2
    const maxX = params.maxX - params.wallMargin - params.caveSizeMax / 2

    const minY = params.minY + params.wallMargin + params.caveSizeMax / 2
    const maxY = params.maxY - params.wallMargin - params.caveSizeMax / 2


    var sizeX = transpose(Math.random(), 0, 1, params.caveSizeMin, params.caveSizeMax)
    var sizeY = transpose(Math.random(), 0, 1, params.caveSizeMin, params.caveSizeMax)

    if (position == null) {
        position = new Point(
            transpose(Math.random(), 0, 1, minX, maxX),
            transpose(Math.random(), 0, 1, minY, maxY)
        )
    }
    const definition = ellipsoid(position, sizeX, sizeY, params.caveCorners)
    return new Cave(position, Math.max(sizeX, sizeY), definition)
}


function randomCaveDistancedFromExisting(params, caves) {
    for (var caveRecount = 0; caveRecount < 100; caveRecount++) {
        const cave = randomCave(params)
        if (caves.some(c => cave.isWithinRange(c, params.caveMinDistance))) {
            continue
        }
        return cave
    }
    return null

}

class Path {
    constructor(from, to, params) {
        this.from = from
        this.to = to
        this.position = new Point(
            (this.from.x + this.to.x) / 2,
            (this.from.y + this.to.y) / 2,
        )
        this.width = transpose(Math.random(), 0, 1, params.pathWidthMin, params.pathWidthMax)

        const pathVect = this.from.vectorTo(this.to)

        this.definition = new BoxPolygonDescription(this.position, pathVect.length, this.width, pathVect.theta)
    }

    polygon(size = 0) {
        return this.definition.createPolygon(size)
    }
}



function generatePaths(caves, params) {
    const cavesLeft = [...caves]
    const cavesProcessed = [cavesLeft.shift()]
    const result = []

    while (cavesLeft.length > 0) {
        var srcCave = null
        var dstCave = null
        var distance = Infinity

        for (var sI = 0; sI < cavesProcessed.length; sI++) {
            for (var sJ = 0; sJ < cavesLeft.length; sJ++) {
                const dist = cavesProcessed[sI].distanceTo(cavesLeft[sJ])
                if (dist < distance) {
                    distance = dist
                    srcCave = cavesProcessed[sI]
                    dstCave = cavesLeft[sJ]
                }
            }
        }
        result.push(new Path(srcCave.position, dstCave.position, params))
        cavesLeft.splice(cavesLeft.indexOf(dstCave), 1)
        cavesProcessed.push(dstCave)
    }
    return result
}


function generateCaves(params) {
    const caves = [randomCave(params, Point.ZERO)]

    for (var i = 0; i < params.caveCount; i++) {
        const newCave = randomCaveDistancedFromExisting(params, caves)
        if (newCave != null) {
            caves.push(newCave)
        } else {
            console.log("Couldn't place all caves")
            break
        }
    }
    return caves
}

export function getStartingMap(subBoundingBox, params={}) {
    params = {...DEFAULT_MAP_PARAMS, ...params}

    const result = new Map()

    const caves = generateCaves(params)
    const paths = generatePaths(caves, params)

    const mask = []
    caves.forEach(c => {
        mask.push(c.polygon())
    })
    paths.forEach(p => {
        mask.push(p.polygon())
    })

    // fill with rocks
    for (var x = params.minX; x < params.maxX; x+= params.boxSize) {
        for (var y = params.minY; y < params.maxY; y+= params.boxSize) {
            const rockDef = boxoid(new Point(x, y), params.boxSize + 5, params.boxAdditionalCorners)
            const poly = rockDef.createPolygon(0)
            if (!mask.some(m => m.overlaps(poly))) {
                result.add(rockDef)
            }
        }
    }
    return result
}
