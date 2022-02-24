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

const DEFAULT_DRAG_COEFFICIENT = 1
const WATER_DENSITY = 1000

const MOVEMENT_HUSH = 0.1
const ROTATION_MOVEMENT_HUSH = 0.05

export class Volume {
    constructor(width, height, length, dragCoefficient = DEFAULT_DRAG_COEFFICIENT) {
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
    }

    // acting force should be a vector
    // rotational force should be a scalar
    updateState(deltaMs, actingForce, rotationalForce = 0) {
        const deltaS = deltaMs / 1000
        this.updatePosition(deltaS, actingForce)
        this.updateRotation(deltaS, rotationalForce)

    }

    updatePosition(deltaS, actingForce) {
        this.lastActingForce = actingForce
        const force = actingForce.plus(this.getFrictionVector())
        const acc = force.div(this.volume.getMass())
        const deltaV = acc.times(deltaS)
        this.speed = this.speed.plus(deltaV)
        if (this.speed.length() < MOVEMENT_HUSH && actingForce.isZero()) {
            this.speed = new Vector(0, 0)
        }
        this.position = this.position.plus(this.speed.times(deltaS))
    }

    getFrictionVector() {
        const angleOfAttack = this.speed.theta() - this.orientation

        const frictionFace = Math.abs(Math.cos(angleOfAttack)) * this.volume.frontSection()
            + Math.abs(Math.sin(angleOfAttack) * this.volume.sideSection())

        const frictionForce =  0.5 * WATER_DENSITY * this.speed.squared() * this.volume.dragCoefficient * frictionFace
        const frictionDir = this.speed.theta() + Math.PI
        return vectorForPolar(frictionForce, frictionDir)

    }

    updateRotation(deltaS, rotationalForce) {
        const frictionForce =  -Math.sign(this.rotationSpeed) * 0.5 * WATER_DENSITY * this.rotationSpeed * this.rotationSpeed * this.volume.dragCoefficient * this.volume.sideSection()
        const force = rotationalForce + frictionForce
        const acc = force / this.volume.getMass()
        const deltaV = acc * deltaS
        this.rotationSpeed = this.rotationSpeed + deltaV
        if (Math.abs(this.rotationSpeed) < ROTATION_MOVEMENT_HUSH && rotationalForce == 0) {
            this.rotationSpeed = 0
        }
        this.orientation = (2 * Math.PI + this.orientation + this.rotationSpeed * deltaS) % (2 * Math.PI)
    }


    dorsalThrustVector(r) {
        return vectorForPolar(r, this.orientation + Math.PI)
    }



}
