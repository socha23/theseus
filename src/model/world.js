import { Fish } from "./entities"
import { Body, Point, rectangle, Volume } from "./physics"
import { Sub } from "./sub"
import { Flock, FlockAgent } from "./agent"

import { SubStatusScreen } from "./subsystems/others"
import { Reactor } from "./subsystems/reactor"
import { Engine } from "./subsystems/engine"
import { Weapon } from "./subsystems/weapons"
import { Tracking } from "./subsystems/tracking"
import { Sonar } from "./subsystems/sonar"
import { Map } from "./map"
import { Pumps } from "./subsystems/pumps"
import { CheatBox } from "./subsystems/cheatbox"
import { Storage } from "./subsystems/storage"
import { MATERIALS } from "./materials"

const WEAPON_TEMPLATES = {
    COILGUN: {
        aimTime: 2000,
        reloadTime: 5000,
        ammoMax: 5,
        powerConsumption: 10,
        range: 25,
    },
    RAILGUN: {
        aimTime: 4000,
        reloadTime: 10000,
        ammoMax: 2,
        powerConsumption: 20,
        range: 45,
    }
}

const ENGINE_TEMPLATES = {
    BASIC_ENGINE: {
        force: 10 * 40 * 1000,
        rotationalForce: 10 * 2 * 1000,
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

const PUMP_TEMPLATES = {
    BASIC_PUMP: {
        pumpPower: 0.05,
        powerConsumption: 10,
        waterResistant: true,
    }
}


const TRACKING_TEMPLATES = {
    BASIC_TRACKING: {
        range: 80,
        powerConsumption: 5,
    }
}

const REACTOR_TEMPLATES = {
    BASIC_REACTOR: {
        maxOutput: 100,
        gridSize: new Point(1, 2),
        waterResistant: true,
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
            new Weapon(new Point(0, 1), "coil", "Coilgun", WEAPON_TEMPLATES.COILGUN),
            new Weapon(new Point(0, 2), "railgun", "Railgun", WEAPON_TEMPLATES.RAILGUN),

            new Sonar(new Point(1, 0), "sonar", "Sonar", SONAR_TEMPLATES.BASIC_SONAR),

            new SubStatusScreen(new Point(3, 0), "status_1", "Status"),
            new Tracking(new Point(3, 1), "tracking_1", "Tracking", TRACKING_TEMPLATES.BASIC_TRACKING),

            new Reactor(new Point(4, 0), "reactor", "Reactor", REACTOR_TEMPLATES.BASIC_REACTOR),
            new Engine(new Point(4, 2), "engine_2", "Engine", ENGINE_TEMPLATES.BASIC_ENGINE),

            new Pumps(new Point(3, 2), "pumps0", "Pumps", PUMP_TEMPLATES.BASIC_PUMP),
            new Storage(new Point(3, 3), "storage0", "Storage", {
                [MATERIALS.SPARE_PARTS]: 20,
                [MATERIALS.LEAK_SEALS]: 5,
                [MATERIALS.KINETIC_AMMO]: 5,
            }),
    ])
}

export function getStartingWorld(map) {
    return new World(
        [
            ...createFlock(map, FISH_TEMPLATES.SMALL_FISH, 10, new Point(20, 20), 40).entities,
            ...createFlock(map, FISH_TEMPLATES.SMALL_FISH, 10, new Point(-20, -20), 40).entities,
            ...createFish(map, FISH_TEMPLATES.FAT_FISH, 10, Point.ZERO, 100),
            ...createFish(map, FISH_TEMPLATES.BIG_FISH, 4, Point.ZERO, 100),
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
        Object
            .values(this.entitiesById)
            .filter(e => e.deleted)
            .forEach(e => {delete this.entitiesById[e.id]})


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

function createFish(map, template, count = 1, position=new Point(0, 0), spread = 100) {
    const result = []
    for (var i = 0; i < count; i++) {

        while (true) {
            const location = randomPointAround(position, spread)
            const fish = new Fish(
                template.id + autoinc++,
                new Body(location, template.volume, Math.random() * 2 * Math.PI),
                template)
            if (!map.detectCollision(fish.boundingBox)) {
                result.push(fish)
                break
            }
        }
    }
    return result
}

function createFlock(map, template, count = 1, position=new Point(0, 0), spread = 100) {
    const flock = new Flock()
    for (var i = 0; i < count; i++) {

        while (true) {

            const location = randomPointAround(position, spread)
            const fish = new Fish(
                template.id + autoinc++,
                new Body(location, template.volume, Math.random() * 2 * Math.PI),
                template,
                new FlockAgent(flock)
                )
            if (!map.detectCollision(fish.boundingBox)) {
                flock.addEntity(fish)
                break
            }
        }

    }
    return flock
}




function randomPolygon(position) {
    const width = 10 + Math.random() * 100
    const height = 10 + Math.random() * 100
    const theta = Math.random() * 2 * Math.PI
    return rectangle(position, new Point(width, height), theta)

}

const DEFAULT_MAP_PARAMS = {
    position: new Point(0, 0),
    featuresCount: 50,
    featuresSpread: 400,
}

export function getStartingMap(subBoundingBox, params={}) {
    params = {...DEFAULT_MAP_PARAMS, ...params}
    const res = new Map()

    res.addFeature(rectangle(new Point(0, -40), new Point(40, 4), -Math.PI / 4))

    for (var i = 0; i < params.featuresCount; i++) {
        while (true) {
            const poly = randomPolygon(randomPointAround(params.position, params.featuresSpread))
            if (!poly.overlaps(subBoundingBox)) {
                res.addFeature(poly)
                break;
            }
        }
    }
    return res
}
