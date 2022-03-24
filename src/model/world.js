import { Fish, Flock, flockPlanCreator } from "./fish"
import { Body, Point, vectorForPolar, Volume } from "./physics"
import { Sub } from "./sub"

import { SubStatusScreen } from "./subsystems/others"
import { Reactor } from "./subsystems/reactor"
import { Engine } from "./subsystems/engine"
import { Weapon } from "./subsystems/weapons"
import { Tracking } from "./subsystems/tracking"
import { Sonar } from "./subsystems/sonar"
import { BucketMap, LinearMap } from "./map"
import { Pumps } from "./subsystems/pumps"
import { CheatBox } from "./subsystems/cheatbox"
import { Storage } from "./subsystems/storage"
import { MATERIALS } from "./materials"
import { randomPolygon } from "./mapGeneration"

const WEAPON_TEMPLATES = {
    COILGUN: {
        aimTime: 2000,
        reloadTime: 5000,
        ammoMax: 5,
        powerConsumption: 10,
        range: 25,
        damage: 10,
    },
    RAILGUN: {
        aimTime: 4000,
        reloadTime: 10000,
        ammoMax: 2,
        powerConsumption: 20,
        range: 45,
        damage: 20,
    }
}

const ENGINE_TEMPLATES = {
    BASIC_ENGINE: {
        force:  40 * 1000,
        rotationalForce: 2 * 1000,
        powerConsumption: 10,
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
        rotationSpeed: 1,
        color: "#AEF3E7"
    },
    FAT_FISH: {
        id: "fat_fish",
        volume: new Volume(2, 2, 3, 0.2),
        tailForce: 25 * 1000,
        rotationalForce: 2 * 1000,
        rotationSpeed: 1,
        color: "#E08E45",
        aggresive: true,
        attacks: [{
            range: 2,
            cooldown: 1000,
            damage: {
                type: "default",
                strength: 5,
            }
        }],
    },
    BIG_FISH: {
        id: "big_fish",
        volume: new Volume(2, 2, 5, 0.1),
        tailForce: 35 * 1000,
        rotationalForce: 2 * 1000,
        rotationSpeed: 1,
        color: "red",
        aggresive: true,
        attacks: [{
            range: 2,
            cooldown: 3000,
            damage: {
                type: "default",
                strength: 10,
            }
        }],
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
                [MATERIALS.FUEL_RODS]: 3,
            }),
    ])
}

export function getStartingWorld(map) {
    return new World(
        [
            ...createFlock(map, FISH_TEMPLATES.SMALL_FISH, 10, new Point(20, 20), 40).entities,
            ...createFlock(map, FISH_TEMPLATES.SMALL_FISH, 10, new Point(-20, -20), 40).entities,
            ...createFish(map, FISH_TEMPLATES.FAT_FISH, 50, Point.ZERO, 400, 70),
            ...createFish(map, FISH_TEMPLATES.BIG_FISH, 15, Point.ZERO, 400, 70),
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
            const deltaX = pos.x - e.position.x
            const deltaY = pos.y - e.position.y
            const r = radius + e.radius

            return deltaX * deltaX + deltaY * deltaY <= r * r
        })


    }
}



var autoinc = 0

function randomPointAround(position, distance) {
    const theta = Math.random() * 2 * Math.PI
    return position.plus(vectorForPolar(distance, theta))
}

function createFish(map, template, count = 1, position=new Point(0, 0), spread = 100, minSpread = 0) {
    const result = []
    for (var i = 0; i < count; i++) {

        while (true) {
            const location = randomPointAround(position, Math.random() * (spread - minSpread) + minSpread)
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
                flockPlanCreator(flock)
                )
            if (!map.detectCollision(fish.boundingBox)) {
                flock.addEntity(fish)
                break
            }
        }

    }
    return flock
}




const DEFAULT_MAP_PARAMS = {
    position: new Point(0, 0),
    featuresCount: 200,
    featuresSpread: 600,
}

export function getStartingMap(subBoundingBox, params={}) {
    params = {...DEFAULT_MAP_PARAMS, ...params}
    const res = new BucketMap()

    for (var i = 0; i < params.featuresCount; i++) {
        while (true) {
            const position = new Point(
                ((Math.random() * 2) - 1) * params.featuresSpread,
                ((Math.random() * 2) - 1) * params.featuresSpread,
            )
            const width = 10 + Math.random() * 40
            const height = width * Math.random()

            const poly = randomPolygon(position, width, height)
            if (!poly.overlaps(subBoundingBox)) {
                res.addFeature(poly)
                break;
            }
        }
    }
    return res
}
