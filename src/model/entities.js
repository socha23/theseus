import { entityHit, HasEffects, Effect } from "./effects"
import { Vector } from "./physics"

var autoinc = 0
export class Entity extends HasEffects {
    constructor(id, body) {
        super()
        this.ordering = Math.random()
        this.id = id
        this.body = body
        this.deleted = false
    }

    get radius() {
        return this.body.volume.radius
    }

    get width() {
        return this.body.volume.width
    }

    get length() {
        return this.body.volume.length
    }

    get orientation() {
        return this.body.orientation
    }

    get speedVector() {
        return this.body.speed
    }

    get mass() {
        return this.body.volume.getMass()
    }

    get lastActingForce() {
        return this.body.lastActingForce
    }

    get targetPosition() {
        return null
    }

    get planDescription() {
        return null
    }

    get position() {
        return this.body.position
    }

    get boundingBox() {
        return this.body.boundingBox
    }

    get color() {
        // for sonar blips
        return "gray"
    }

    onHit(hit) {
        const position = hit.position.plus(new Vector(-this.x, -this.y)).rotate(-this.orientation)
        this.addEffect(hitMarkStatus(position, hit.strength))
    }

    onCollision(collision) {
    }

    updateState(deltaMs, model) {
        super.updateState(deltaMs, model)
        this.body.updateState(deltaMs, model, c => {this.onCollision(c)})

    }

    distanceTo(p) {
        return this.position.distanceTo(p)
    }

    get x() {
        return this.position.x
    }

    get y() {
        return this.position.y
    }

    toViewState() {
        return {
            effects: this.effectsViewState(),
            hitMarks: this.hitMarksViewState(),
            id: this.id,
            position: this.body.position,
            color: this.color,
            radius: this.radius,
            width: this.body.volume.width,
            length: this.body.volume.length,
            orientation: this.body.orientation,
            mass: this.mass,
            lastActingForce: this.lastActingForce,
            speed: this.body.speed.length,
        }
    }

    hitMarksViewState() {
        return this.effects
            .filter(e => e.type === HIT_MARK_STATUS)
            .map(h => ({
                id: h.id,
                position: h.params.position,
                strength: h.params.strength,
            }))
    }
}

const HIT_MARK_STATUS = "hitMark"

function hitMarkStatus(position, strength = 10) {
    return new Effect({
        type: HIT_MARK_STATUS,
        durationMs:  500,
        position,
        strength,
    })
}

