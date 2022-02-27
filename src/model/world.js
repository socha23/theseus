import { Entity, Fish } from "./entities"
import { Body, Point, Volume } from "./physics"
import {Sub, Weapon, Engine, Reactor, SubStatusScreen, Steering, Sonar, Tracking} from "./sub.js"
import { Agent, Flock, FlockAgent } from "./agent"

const WEAPON_TEMPLATES = {
    COILGUN: {
        aimTime: 500,
        aimDecay: 10000,
        reloadTime: 5000,
        reloadDecay: 1000,
        ammoMax: 5,
    },
    RAILGUN: {
        aimTime: 5000,
        aimDecay: 1000,
        reloadTime: 10000,
        reloadDecay: 1000,
        ammoMax: 2,
    }
}

const ENGINE_TEMPLATES = {
    BASIC_ENGINE: {
        force: 100 * 1000,
        rotationalForce: 50 * 1000,
        powerConsumption: 40,
    }
}

const SONAR_TEMPLATES = {
    BASIC_SONAR: {
        range: 50,
    }
}

const REACTOR_TEMPLATES = {
    BASIC_REACTOR: {
        maxOutput: 100,
    }
}

const FISH_TEMPLATES = {
    SMALL_FISH: {
        id: "small_fish",
        volume: new Volume(0.5, 0.5, 2, 0.2),
        tailForce: 2 * 1000,
        rotationalForce: 1 * 1000,
        rotationSpeed: Math.PI,
    },
    FAT_FISH: {
        id: "fat_fish",
        volume: new Volume(1, 1, 3, 0.2),
        tailForce: 10 * 1000,
        rotationalForce: 2 * 1000,
        rotationSpeed: Math.PI,
    },
    BIG_FISH: {
        id: "big_fish",
        volume: new Volume(2, 2, 5, 0.1),
        tailForce: 50 * 1000,
        rotationalForce: 2 * 1000,
        rotationSpeed: Math.PI * 4,
    },

}

export function getStartingSub() {
    return new Sub(
        new Volume(5, 5, 30),
        [
            new Weapon("coil_1", "Coilgun #1", WEAPON_TEMPLATES.COILGUN),
            new Weapon("coil_2", "Coilgun #2", WEAPON_TEMPLATES.COILGUN),
            new Weapon("railgun", "Railgun", WEAPON_TEMPLATES.RAILGUN),

            new Sonar("sonar", "Sonar", SONAR_TEMPLATES.BASIC_SONAR),

            new SubStatusScreen("status_1", "Status"),
            new Tracking("tracking_1", "Tracking"),

            new Reactor("reactor", "Reactor", REACTOR_TEMPLATES.BASIC_REACTOR),
            new Engine("engine_1", "Engine #1", ENGINE_TEMPLATES.BASIC_ENGINE),
            new Engine("engine_2", "Engine #2", ENGINE_TEMPLATES.BASIC_ENGINE),
            new Steering("steering_1", "Steering"),
    ])
}

export function getStartingWorld() {
    return new World(
        [
            ...createFlock(FISH_TEMPLATES.SMALL_FISH, 10, new Point(20, 20), 40).entities,
            ...createFlock(FISH_TEMPLATES.SMALL_FISH, 10, new Point(-20, -20), 40).entities,
            ...createFish(FISH_TEMPLATES.FAT_FISH, 10, Point.ZERO, 100),
            ...createFish(FISH_TEMPLATES.BIG_FISH, 4, Point.ZERO, 100),
        ]
    )
}


export class World {
    constructor(entities = []) {
        this.entitiesById = {}
        entities.forEach(e => this.entitiesById[e.id] = e)
    }

    getEntity(id) {
        return this.entitiesById[id]
    }

    updateState(deltaMs, model) {
        Object.values(this.entitiesById).forEach(e => {
            e.updateState(deltaMs, model)
        })
    }

    getEntitiesAround(pos, radius) {
        return Object.values(this.entitiesById).filter(e => {
            const deltaX = pos.x - e.getPosition().x
            const deltaY = pos.y - e.getPosition().y
            const r = radius + e.getRadius()

            return deltaX * deltaX + deltaY * deltaY <= r * r
        })


    }
}



var autoinc = 0

function randomPointAround(position, distanceMax) {
    const dx = (Math.random() * 2 - 1) * distanceMax
    const dy = (Math.random() * 2 - 1) * distanceMax

    return new Point(position.x + dx, position.y + dy)
}

function createFish(template, count = 1, position=new Point(0, 0), spread = 100) {
    const result = []
    for (var i = 0; i < count; i++) {
        const location = randomPointAround(position, spread)
        result.push(new Fish(
            template.id + autoinc++,
            new Body(location, template.volume, Math.random() * 2 * Math.PI),
            template))
    }
    return result
}

function createFlock(template, count = 1, position=new Point(0, 0), spread = 100) {
    const flock = new Flock()
    for (var i = 0; i < count; i++) {
        const location = randomPointAround(position, spread)
        flock.addEntity(new Fish(
            template.id + autoinc++,
            new Body(location, template.volume, Math.random() * 2 * Math.PI),
            template,
            new FlockAgent(flock))
        )
    }
    return flock
}
