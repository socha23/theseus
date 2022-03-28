import { STATISTICS } from "../stats"

export function vectorForPolar(r, theta) {
    return new Vector(r * Math.cos(theta), r * Math.sin(theta))
}

export class Point {
    static ZERO = new Point(0, 0)

    constructor(x, y) {
        this.x = x
        this.y = y
    }

    plus(v) {
        return new Point(this.x + v.x, this.y + v.y)
    }

    minus(v) {
        return new Point(this.x - v.x, this.y - v.y)
    }

    distanceTo(p) {
        const dX = p.x - this.x
        const dY = p.y - this.y
        return Math.sqrt(dX * dX + dY * dY)
    }

    negative() {
        return new Point(-this.x, -this.y)
    }

    rotate(theta, origin=Point.ZERO) {
        return new Point(
            Math.cos(theta) * (this.x - origin.x) - Math.sin(theta) * (this.y - origin.y) + origin.x,
            Math.sin(theta) * (this.x - origin.x) + Math.cos(theta) * (this.y - origin.y) + origin.y,
        )
    }

    vectorTo(p) {
        return new Vector(p.x - this.x, p.y - this.y)
    }

    get string() {
        return `${this.x.toFixed(1)}, ${this.y.toFixed(1)}`
    }
}

export class Vector {
    static ZERO = new Vector(0, 0)

    constructor(x, y) {
        this.x = x
        this.y = y
    }

    plus(v) {
        return new Vector(this.x + v.x, this.y + v.y)
    }

    negative() {
        return new Vector(-this.x, -this.y)
    }


    div(c) {
        return new Vector(this.x / c, this.y / c)
    }

    multiply(c) {
        return this.times(c)
    }

    times(c) {
        return new Vector(this.x * c, this.y * c)
    }

    get length() {
        return Math.sqrt(this.squared())
    }

    squared() {
        return this.x * this.x + this.y * this.y
    }

    get theta() {
        return Math.atan2(this.y, this.x)
    }

    isZero() {
        return this.x === 0 && this.y === 0
    }

    withLength(len = 1) {
        const multiplier = len / this.length
        return new Vector(this.x * multiplier, this.y * multiplier)
    }

    withTheta(theta=0) {
        return vectorForPolar(this.length, theta)
    }

}

export const DRAG_COEFFICIENTS = {
    SLEEK: 0.2,
    DEFAULT: 1,
}

const WATER_DENSITY = 1000

const MOVEMENT_HUSH = 0.1
const ROTATION_MOVEMENT_HUSH = 0.05

export class Volume {
    constructor(width, height, length, dragCoefficient = DRAG_COEFFICIENTS.DEFAULT) {
        this.width = width
        this.height = height
        this.length = length
        this.dragCoefficient = dragCoefficient
    }

    frontSection() {
        return this.width * this.height
    }

    sideSection() {
        return this.height * this.length
    }

    get radius() {
        return Math.max(this.width, this.height, this.length) / 2
    }

    getMass(density = WATER_DENSITY) {
        return this.width * this.height * this.length * density
    }

    get key() {
        return `${this.width}_${this.height}_${this.length}_${this.dragCoefficient}`
    }

}

export class Body {
    constructor(position,
        volume,
        orientation = 0
        ) {
        this.position = new Point(position.x, position.y)
        this.volume = volume
        this.orientation = orientation
        this.speed = new Vector(0, 0)
        this.rotationSpeed = 0
        this.lastActingForce = Vector.ZERO

        this._actingForce = Vector.ZERO
        this._actingRotation = 0
        this._actingFixedOrientation = null
    }

    // acting force should be a vector
    // rotational force should be a scalar

    addActingForce(force) {
        this._actingForce = this._actingForce.plus(force)
    }

    addActingRotation(rotation) {
        this._actingRotation += rotation
    }

    setActingOrientation(orientation) {
        this._actingFixedOrientation = orientation
    }

    get actingFixedOrientation() {
        return this._actingFixedOrientation
    }


    updateState(deltaMs, model, onCollision) {
        const deltaS = deltaMs / 1000

        const updateStart = window.performance.now()

        var projectedMove = this._projectMove(deltaS)
        var recounts = 0
        while (true) {
            const collision = model.map.detectWallCollision(projectedMove.boundingBox, projectedMove.speed)
            if (collision) {
                this._resolveCollision(collision, onCollision)

                projectedMove = this._projectMove(deltaS)
                if (recounts === 50) {
                    break
                }
                recounts++
                projectedMove = this._projectMove(deltaS)
            } else {
                break
            }
        }
        STATISTICS.PHYSICS_UPDATE.add(window.performance.now() - updateStart)

        this.position = projectedMove.position
        this.orientation = projectedMove.orientation
        this.speed = projectedMove.speed
        this.rotationSpeed = projectedMove.rotationSpeed

        this.lastActingForce = this._actingForce
        this._actingForce = Vector.ZERO
        this._actingRotation = 0
        this._actingFixedOrientation = null
    }

    _resolveCollision(collision, onCollision) {
        const IMPACT_SPEED_MULTIPLIER = 0.95
        var newSpeedValue = Math.cos(collision.angle) * this.speed.length * IMPACT_SPEED_MULTIPLIER
        if (Math.abs(newSpeedValue) < MOVEMENT_HUSH) {
            newSpeedValue = 0
        }
        const newActForceVal = Math.cos(collision.angle) * this._actingForce.length
        this.speed = vectorForPolar(newSpeedValue, collision.mapFeatureWall.theta)
        this.rotationSpeed = 0
        this._actingForce = vectorForPolar(newActForceVal, collision.mapFeatureWall.theta)
        this._actingRotation = this._actingRotation * IMPACT_SPEED_MULTIPLIER
        if (Math.abs(this._actingRotation) < ROTATION_MOVEMENT_HUSH) {
            this._actingRotation = 0
        }
        this._actingFixedOrientation = null

        collision.relativeAngle = (2 * Math.PI + collision.impactForce.theta - this.orientation) % (2 * Math.PI)

        onCollision(collision)
    }

    willCrashIntoWall(map, deltaS = 1, speed = this.speed) {
        for (var t = 0.1; t < deltaS; t += 0.1) {
            const moveVector = speed.times(deltaS)
            const projPos = this.position.plus(moveVector)
            const projBox = rectangle(projPos, new Point(this.volume.length, this.volume.width)).rotate(this.orientation, projPos)
            const collision = map.detectWallCollision(projBox, moveVector, false)
            if (collision != null) {
                return true
            }
        }
    }

    teleportOutOfCollision(map) {
        for (var dist = 5; dist < 200; dist += 5) {
            for (var theta = 0; theta < 2 * Math.PI; theta += Math.PI / 16) {
                const newPos = this.position.plus(vectorForPolar(dist, theta))
                const projBox = rectangle(newPos, new Point(this.volume.length, this.volume.width)).rotate(this.orientation, newPos)
                const collision = map.detectWallCollision(projBox)
                if (!collision) {
                    console.log("Teleported out of collision")
                    this.position = newPos
                    this.speed = Vector.ZERO
                    this.rotationSpeed = 0
                }
            }
        }
        throw new Error("Can't teleport out of collision")
    }

    _projectSpeedAndPosition(deltaS, position, speed, orientation, actingForce=Vector.ZERO) {
        const force = actingForce.plus(this.getFrictionVector(speed, orientation))
        const acc = force.div(this.volume.getMass())
        const deltaV = acc.times(deltaS)
        var projectedSpeed = speed.plus(deltaV)
        if (projectedSpeed.length < MOVEMENT_HUSH && actingForce.isZero()) {
            projectedSpeed = new Vector(0, 0)
        }
        const projectedPosition = position.plus(projectedSpeed.times(deltaS))

        return {
            position: projectedPosition,
            speed: projectedSpeed,
        }
    }

    _projectMove(deltaS) {


        // speed and position
        const projection = this._projectSpeedAndPosition(deltaS, this.position, this.speed, this.orientation, this._actingForce)
        const projectedPosition = projection.position
        const projectedSpeed = projection.speed
        // orientation and rotation speed

        const frictionForce =  -Math.sign(this.rotationSpeed) * 0.5 * WATER_DENSITY * this.rotationSpeed * this.rotationSpeed * this.volume.dragCoefficient * this.volume.sideSection()
        const rForce = this._actingRotation + frictionForce
        const rAcc = rForce / this.volume.getMass()
        const rDeltaV = rAcc * deltaS
        var projectedRotationSpeed = this.rotationSpeed + rDeltaV
        if (Math.abs(projectedRotationSpeed) < ROTATION_MOVEMENT_HUSH && this._actingRotation === 0) {
            this.rotationSpeed = 0
        }
        const projectedOrientation = this._actingFixedOrientation != null ? this._actingFixedOrientation : ((2 * Math.PI + this.orientation + projectedRotationSpeed * deltaS) % (2 * Math.PI))

        const projectedBoundingBox = rectangle(projectedPosition, new Point(this.volume.length, this.volume.width)).rotate(projectedOrientation, projectedPosition)

        return {
            position: projectedPosition,
            orientation: projectedOrientation,
            speed: projectedSpeed,
            rotationSpeed: projectedRotationSpeed,
            boundingBox: projectedBoundingBox,
        }
    }

    getFrictionVector(speed=this.speed, orientation=this.orientation) {
        const angleOfAttack = speed.theta - orientation

            const frictionFace = Math.abs(Math.cos(angleOfAttack)) * this.volume.frontSection()
            + Math.abs(Math.sin(angleOfAttack) * this.volume.sideSection())

        const coeffMultiplier = (frictionFace / this.volume.frontSection()) * (frictionFace / this.volume.frontSection())

        const frictionForce =  0.5 * WATER_DENSITY * speed.squared() * this.volume.dragCoefficient * coeffMultiplier * frictionFace
        const frictionDir = speed.theta + Math.PI
        return vectorForPolar(frictionForce, frictionDir)

    }

    get boundingBox() {
        return rectangle(this.position, new Point(this.volume.length, this.volume.width)).rotate(this.orientation, this.position)
    }


    dorsalThrustVector(r) {
        return vectorForPolar(r, this.orientation)
    }

    get radius() {
        return this.volume.radius
    }
}



export class Edge {
    constructor(from, to) {
        this.from = from
        this.to = to
    }

    intersects(other) {
        // https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
        // Some variables for reuse, others may do this differently

        const p0x = this.from.x;
        const p0y = this.from.y;
        const p1x = this.to.x;
        const p1y = this.to.y;
        const p2x = other.from.x;
        const p2y = other.from.y;
        const p3x = other.to.x;
        const p3y = other.to.y;

        var d, dx1, dx2, dx3, dy1, dy2, dy3, s, t;

        dx1 = p1x - p0x;      dy1 = p1y - p0y;
        dx2 = p3x - p2x;      dy2 = p3y - p2y;
        dx3 = p0x - p2x;      dy3 = p0y - p2y;

        d = dx1 * dy2 - dx2 * dy1;

        if(d !== 0){
            s = dx1 * dy3 - dx3 * dy1;
            if((s <= 0 && d < 0 && s >= d) || (s >= 0 && d > 0 && s <= d)){
                t = dx2 * dy3 - dx3 * dy2;
                if((t <= 0 && d < 0 && t > d) || (t >= 0 && d > 0 && t < d)){
                    t = t / d;
                    return new Point(p0x + t * dx1, p0y + t * dy1)
                }
            }
        }
        return null
    }

    get theta() {
        return Math.atan2(this.from.y - this.to.y, this.from.x - this.to.x)
    }

    toVector() {
        return new Vector(this.to.x - this.from.x, this.to.y - this.from.y)
    }
}

export class Polygon {
    constructor(points) {
        this.points = points

        var minX = Infinity
        var maxX = -Infinity
        var minY = Infinity
        var maxY = -Infinity
        this.points.forEach(p => {
            minX = Math.min(minX, p.x)
            maxX = Math.max(maxX, p.x)
            minY = Math.min(minY, p.y)
            maxY = Math.max(maxY, p.y)
        })
        this._simpleBoundingBox = new SimpleRect(minX, minY, maxX - minX, maxY - minY)
    }

    overlaps(other) {
        for (var x = 0; x < 2; x++) {
            const polygon = (x === 0) ? this : other;

            for (var i1 = 0; i1 < polygon.points.length; i1++) {
                var i2 = (i1 + 1) % polygon.points.length

                const p1 = polygon.points[i1]
                const p2 = polygon.points[i2]

                const normal = new Point(p2.y - p1.y, p1.x - p2.x)

                var minA = Infinity
                var maxA = -Infinity

                for (var i = 0; i < this.points.length; i++) {
                    const p = this.points[i]
                    const projected = normal.x * p.x + normal.y * p.y
                    if (projected < minA) {
                        minA = projected
                    }
                    if (projected > maxA) {
                        maxA = projected
                    }
                }

                var minB = Infinity
                var maxB = -Infinity

                for (i = 0; i < other.points.length; i++) {
                    const p = other.points[i]
                    const projected = normal.x * p.x + normal.y * p.y

                    if (projected < minB) {
                        minB = projected
                    }
                    if (projected > maxB) {
                        maxB = projected
                    }
                }

                if (maxA < minB || maxB < minA) {
                    return false
                }
            }
        }
        return true
    }

    get edges() {
        const res = []
        for (var i1 = 0; i1 < this.points.length; i1++) {
            var i2 = (i1 + 1) % this.points.length
            res.push(new Edge(this.points[i1], this.points[i2]))
        }
        return res
    }

    myOverlappingEdge(polygon) {
        var result = null
        this.edges.forEach(e => {
            polygon.edges.forEach(f => {
                if (e.intersects(f)) {
                    result = e
                }
            })
        })
        return result
    }

    rotate(theta, origin=this._center()) {
        if (theta !== 0) {
            this.points = this.points.map(p => p.rotate(theta, origin))
        }
        return this
    }

    _center() {
        var minX = Infinity
        var maxX = -Infinity
        var minY = Infinity
        var maxY = -Infinity
        this.points.forEach(p => {
            minX = Math.min(minX, p.x)
            maxX = Math.max(maxX, p.x)
            minY = Math.min(minY, p.y)
            maxY = Math.max(maxY, p.y)
        })
        return new Point((minX + maxX) / 2, (minY + maxY) / 2)
    }

    get simpleBoundingBox() {
        return this._simpleBoundingBox
    }
}

export function rectangle(position, size, theta=0) {
    return new Polygon([
        new Point(position.x - size.x / 2, position.y - size.y / 2),
        new Point(position.x - size.x / 2, position.y + size.y / 2),
        new Point(position.x + size.x / 2, position.y + size.y / 2),
        new Point(position.x + size.x / 2, position.y - size.y / 2),
    ]).rotate(theta)
}

export class SimpleRect {
    constructor(x, y, width, height) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }

    get simpleBoundingBox() {
        return this
    }

    contains(p) {
        return this.x <= p.x
            && p.x <= this.x + this.width
            && this.y <= p.y
            && p.y <= this.y + this.height
    }
}
