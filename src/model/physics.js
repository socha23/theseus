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

        this._nextPosition = new Point(position.x, position.y)
        this._nextOrientation = orientation
    }

    stop() {
        this.rotationSpeed = 0
        this.speed = Vector.ZERO
    }

    // acting force should be a vector
    // rotational force should be a scalar
    updateState(deltaMs, actingForce, rotationalForce = 0) {
        const deltaS = deltaMs / 1000
        this._nextPosition = this._updatePosition(deltaS, actingForce)
        this._nextOrientation = this._updateOrientation(deltaS, rotationalForce)
    }

    _updatePosition(deltaS, actingForce) {
        this.lastActingForce = actingForce
        const force = actingForce.plus(this.getFrictionVector())
        const acc = force.div(this.volume.getMass())
        const deltaV = acc.times(deltaS)
        this.speed = this.speed.plus(deltaV)
        if (this.speed.length() < MOVEMENT_HUSH && actingForce.isZero()) {
            this.speed = new Vector(0, 0)
        }
        return this.position.plus(this.speed.times(deltaS))
    }

    getFrictionVector() {
        const angleOfAttack = this.speed.theta() - this.orientation

        const frictionFace = Math.abs(Math.cos(angleOfAttack)) * this.volume.frontSection()
            + Math.abs(Math.sin(angleOfAttack) * this.volume.sideSection())

        const frictionForce =  0.5 * WATER_DENSITY * this.speed.squared() * this.volume.dragCoefficient * frictionFace
        const frictionDir = this.speed.theta() + Math.PI
        return vectorForPolar(frictionForce, frictionDir)

    }

    _updateOrientation(deltaS, rotationalForce) {
        const frictionForce =  -Math.sign(this.rotationSpeed) * 0.5 * WATER_DENSITY * this.rotationSpeed * this.rotationSpeed * this.volume.dragCoefficient * this.volume.sideSection()
        const force = rotationalForce + frictionForce
        const acc = force / this.volume.getMass()
        const deltaV = acc * deltaS
        this.rotationSpeed = this.rotationSpeed + deltaV
        if (Math.abs(this.rotationSpeed) < ROTATION_MOVEMENT_HUSH && rotationalForce == 0) {
            this.rotationSpeed = 0
        }
        return (2 * Math.PI + this.orientation + this.rotationSpeed * deltaS) % (2 * Math.PI)
    }

    commitUpdate() {
        this.position = this._nextPosition
        this.orientation = this._nextOrientation
    }

    get nextBoundingBox() {
        return rectangle(this._nextPosition, new Point(this.volume.length, this.volume.width)).rotate(this._nextOrientation, this._nextPosition)

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
