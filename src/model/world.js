import { Entity, Fish } from "./entities"
import { Body, Point, Volume } from "./physics"
import {CheatBox, Sub, Engine, Reactor, SubStatusScreen, Steering, Sonar, Tracking} from "./sub.js"
import { Agent, Flock, FlockAgent } from "./agent"

import {Weapon} from "./subsystems/weapons"

const WEAPON_TEMPLATES = {
    COILGUN: {
        aimTime: 500,
        aimDecay: 10000,
        reloadTime: 5000,
        reloadDecay: 1000,
        ammoMax: 5,
        powerConsumption: 10,
    },
    RAILGUN: {
        aimTime: 5000,
        aimDecay: 1000,
        reloadTime: 10000,
        reloadDecay: 1000,
        ammoMax: 2,
        powerConsumption: 15,
    }
}

const ENGINE_TEMPLATES = {
    BASIC_ENGINE: {
        force: 40 * 1000,
        rotationalForce: 2 * 1000,
        powerConsumption: 20,
    }
}

const SONAR_TEMPLATES = {
    BASIC_SONAR: {
        range: 50,
        powerConsumption: 10,
        gridSize: new Point(2, 3),
    }
}

const REACTOR_TEMPLATES = {
    BASIC_REACTOR: {
        maxOutput: 100,
        gridSize: new Point(1, 2),
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
        new Volume(2, 2, 10),
        [
            new CheatBox(new Point(0, 0)),
            new Weapon(new Point(0, 1), "coil_1", "Coilgun #1", WEAPON_TEMPLATES.COILGUN),
            new Weapon(new Point(0, 2), "coil_2", "Coilgun #2", WEAPON_TEMPLATES.COILGUN),
            new Weapon(new Point(0, 3), "railgun", "Railgun", WEAPON_TEMPLATES.RAILGUN),

            new Sonar(new Point(1, 0), "sonar", "Sonar", SONAR_TEMPLATES.BASIC_SONAR),

            new SubStatusScreen(new Point(3, 0), "status_1", "Status"),
            new Tracking(new Point(3, 1), "tracking_1", "Tracking"),

            new Reactor(new Point(4, 0), "reactor", "Reactor", REACTOR_TEMPLATES.BASIC_REACTOR),
            new Engine(new Point(4, 2), "engine_2", "Engine", ENGINE_TEMPLATES.BASIC_ENGINE),
            new Steering(new Point(4, 3), "steering_1", "Steering"),
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
