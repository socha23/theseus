function vectorForPolar(r, theta) {
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

    length() {
        return Math.sqrt(this.squared())
    }

    squared() {
        return this.x * this.x + this.y * this.y
    }

    theta() {
        return Math.atan2(this.y, this.x)
    }

    isZero() {
        return this.x == 0 && this.y == 0
    }

    withLength(len = 1) {
        const multiplier = len / this.length()
        return new Vector(this.x * multiplier, this.y * multiplier)
    }


}

export const DRAG_COEFFICIENTS = {
    SLEEK: 0.2,
    DEFAULT: 1,
}

const DEFAULT_DRAG_COEFFICIENT = 1
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

    getRadius() {
        return Math.max(this.width, this.height, this.length) / 2
    }

    getMass(density = WATER_DENSITY) {
        return this.width * this.height * this.length * density
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


    updateState(deltaMs, model, onCollision) {
        const deltaS = deltaMs / 1000

        var projectedMove = this._projectMove(deltaS)


        var recounts = 0
        while (true) {
            const collision = model.map.detectCollision(projectedMove.boundingBox)
            if (collision) {
                this._resolveCollision(collision, onCollision)

                if (recounts == 50) {
                    console.log("COLLISION RECOUNTS MAX")
                    break
                }

                recounts++
                projectedMove = this._projectMove(deltaS)
            } else {
                break
            }
        }
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
        const collisionAngle = this.speed.theta() - collision.mapFeatureWall.theta()

        const IMPACT_SPEED_MULTIPLIER = 0.95

        var newSpeedValue = Math.cos(collisionAngle) * this.speed.length() * IMPACT_SPEED_MULTIPLIER
        if (Math.abs(newSpeedValue) < MOVEMENT_HUSH) {
            newSpeedValue = 0
        }

        const newActForceVal = Math.cos(collisionAngle) * this._actingForce.length()
        const impactSpeed = Math.sin(collisionAngle) * this.speed.length()

//        console.log("edge theta", collision.mapFeatureWall.theta())
//        console.log("new speed val", )

        this.speed = vectorForPolar(newSpeedValue, collision.mapFeatureWall.theta())
        this.rotationSpeed = 0
        this._actingForce = vectorForPolar(newActForceVal, collision.mapFeatureWall.theta())
        this._actingRotation = this._actingRotation * IMPACT_SPEED_MULTIPLIER
        if (Math.abs(this._actingRotation) < ROTATION_MOVEMENT_HUSH) {
            this._actingRotation = 0
        }
        this._actingFixedOrientation = null

        collision.angle = collisionAngle
        collision.impactSpeed =  impactSpeed

        onCollision(collision)
    }

    _projectMove(deltaS) {

        // speed and position

        const force = this._actingForce.plus(this.getFrictionVector())
        const acc = force.div(this.volume.getMass())
        const deltaV = acc.times(deltaS)
        var projectedSpeed = this.speed.plus(deltaV)
        if (projectedSpeed.length() < MOVEMENT_HUSH && this._actingForce.isZero()) {
            projectedSpeed = new Vector(0, 0)
        }
        const projectedPosition = this.position.plus(projectedSpeed.times(deltaS))

        // orientation and rotation speed

        const frictionForce =  -Math.sign(this.rotationSpeed) * 0.5 * WATER_DENSITY * this.rotationSpeed * this.rotationSpeed * this.volume.dragCoefficient * this.volume.sideSection()
        const rForce = this._actingRotation + frictionForce
        const rAcc = rForce / this.volume.getMass()
        const rDeltaV = rAcc * deltaS
        var projectedRotationSpeed = this.rotationSpeed + rDeltaV
        if (Math.abs(projectedRotationSpeed) < ROTATION_MOVEMENT_HUSH && this._actingRotation == 0) {
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

    getFrictionVector() {
        const angleOfAttack = this.speed.theta() - this.orientation

        const frictionFace = Math.abs(Math.cos(angleOfAttack)) * this.volume.frontSection()
            + Math.abs(Math.sin(angleOfAttack) * this.volume.sideSection())

        const frictionForce =  0.5 * WATER_DENSITY * this.speed.squared() * this.volume.dragCoefficient * frictionFace
        const frictionDir = this.speed.theta() + Math.PI
        return vectorForPolar(frictionForce, frictionDir)

    }

    get boundingBox() {
        return rectangle(this.position, new Point(this.volume.length, this.volume.width)).rotate(this.orientation, this.position)
    }


    dorsalThrustVector(r) {
        return vectorForPolar(r, this.orientation + Math.PI)
    }

    get radius() {
        return this.volume.getRadius()
    }
}



class Edge {
    constructor(from, to) {
        this.from = from
        this.to = to
    }

    intersects(other) {
        // after https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
        const a = this.from.x
        const b = this.from.y
        const c = this.to.x
        const d = this.to.y
        const p = other.from.x
        const q = other.from.y
        const r = other.to.x
        const s = other.to.y

        var det, gamma, lambda;
        det = (c - a) * (s - q) - (r - p) * (d - b);
        if (det === 0) {
          return false;
        } else {
          lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
          gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
          return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
        }
    }

    theta() {
        return Math.atan2(this.from.y - this.to.y, this.from.x - this.to.x)
    }
}

export class Polygon {
    constructor(points) {
        this.points = points
    }

    overlaps(other) {
        for (var x = 0; x < 2; x++) {
            const polygon = (x == 0) ? this : other;

            for (var i1 = 0; i1 < polygon.points.length; i1++) {
                var i2 = (i1 + 1) % polygon.points.length

                const p1 = polygon.points[i1]
                const p2 = polygon.points[i2]

                const normal = new Point(p2.y - p1.y, p1.x - p2.x)

                var minA = Infinity
                var maxA = -Infinity

                this.points.forEach(p => {
                    const projected = normal.x * p.x + normal.y * p.y
                    if (projected < minA) {
                        minA = projected
                    }
                    if (projected > maxA) {
                        maxA = projected
                    }
                })

                var minB = Infinity
                var maxB = -Infinity

                other.points.forEach(p => {
                    const projected = normal.x * p.x + normal.y * p.y

                    if (projected < minB) {
                        minB = projected
                    }
                    if (projected > maxB) {
                        maxB = projected
                    }
                })

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
        if (theta != 0) {
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
}

export function rectangle(position, size, theta=0) {
    return new Polygon([
        new Point(position.x - size.x / 2, position.y - size.y / 2),
        new Point(position.x - size.x / 2, position.y + size.y / 2),
        new Point(position.x + size.x / 2, position.y + size.y / 2),
        new Point(position.x + size.x / 2, position.y - size.y / 2),
    ]).rotate(theta)
}
