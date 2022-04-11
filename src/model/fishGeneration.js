import { Body, Point, rectangle, vectorForPolar, Volume, Polygon } from "./physics"

import { transpose, randomElem, paramColorValue, paramValue, paramFromValue } from "../utils"

import { Fish } from "./fish"



const FISHES = {
    SMALL_FISH: {
        id: "small_fish",
        ac: 5,
        maxSpeed: 8,
        volume: new Volume(0.5, 0.5, 2, 0.2),
        tailForce: 2 * 1000,
        rotationSpeed: 1,
        color: "#AEF3E7",
        flocking: {
            flockRange: 15,
            flockSatisfyTime: {from: 1000, to: 5000},
        }
    },
    GOAT_FISH: {
        id: "goat_fish",
        ac: 8,
        maxSpeed: 5,
        volume: new Volume(1, 1, 3, 0.2),
        tailForce: 5 * 1000,
        rotationSpeed: 1,
        color: {
            h: {from: 217, to: 220},
            s: {from: 70, to: 90},
            l: {from: 50, to: 70},
        },
        territoryRange: 30,
    },
    ORANGE_FISH: {
        id: "orange_fish",
        ac: 10,
        maxSpeed: 8,
        volume: new Volume(2, 2, 3, 0.2),
        tailForce: 25 * 1000,
        rotationSpeed: 1,
        color: "#E08E45",
        aggresive: true,
        sightRange: 50,
        territoryRange: 100,
        attacks: [{
            range: 2,
            cooldown: 1000,
            damage: {
                type: "default",
                strength: {from: 0, to: 20},
            }
        }],
    },
    BITER: {
        id: "biter",
        ac: 5,
        volume: new Volume(1, 1, 2, 0.2),
        tailForce: 10 * 1000,
        rotationSpeed: 1,
        color: {
            h: 277,
            s: {from: 70, to: 90},
            l: {from: 60, to: 80},
        },
        aggresive: true,
        sightRange: 30,
        territoryRange: 30,
        flocking: {
            flockRange: 10,
            flockSatisfyTime: {from: 1000, to: 5000},
        },
        attacks: [{
            range: 2,
            cooldown: 7000,
            damage: {
                type: "default",
                strength: {from: 0, to: 10},
            }
        }],
    },
    RED_FISH: {
        id: "big_fish",
        ac: 25,
        maxSpeed: 12,
        volume: new Volume(2, 2, 5, 0.1),
        tailForce: 35 * 1000,
        rotationSpeed: 1,
        color: "red",
        aggresive: true,
        defaultSubFear: -40,
        attacks: [{
            range: 2,
            cooldown: 3000,
            damage: {
                type: "default",
                strength: {from: 18, to: 28},
            }
        }],
    },

}


const DEFAULT_PARAMS = {
    startDistanceSubFromAggresive: 10,
    fishes: [
        {
            type: FISHES.SMALL_FISH,
            count: 30,
            flockSize: {from: 5, to: 15}
        },
        {
            type: FISHES.GOAT_FISH,
            count: 100,
        },
        {
            type: FISHES.ORANGE_FISH,
            count: 0//50,
        },
        {
            type: FISHES.BITER,
            count: 0,//20,
            flockSize: {from: 3, to: 5}
        },
        {
            type: FISHES.RED_FISH,
            count: 0//30,
        }
        ]
}


var autoinc = 0

function fish(pos, template) {
    return new Fish(
        template.id + autoinc++,
        new Body(pos, template.volume, Math.random() * 2 * Math.PI),
        {
            ...template,
            color: paramColorValue(template.color),
        })
}


function makeFlock(map, subPos, minSubDistFromAggresive, fishType, flockSize) {
    const checkedRadius = fishType.volume.radius * 4

    const dist = 10

    var flockPos = map.randomPosition(checkedRadius)
    while (fishType.aggresive && subPos.distanceTo(flockPos) < minSubDistFromAggresive) {
        flockPos = map.randomPosition(checkedRadius)
    }
    const result = []

    for (var i = 0; i < flockSize; i++) {
        var pos = flockPos
        for (var j = 0; j < 100; j++) {
            pos = flockPos.plus(vectorForPolar(dist, Math.random() * 2 * Math.PI))
            if (!map.detectCollision(rectangle(pos, new Point(checkedRadius, checkedRadius)))) {
                break;
            }
            pos = flockPos
        }
        result.push(fish(pos, fishType))

    }
    return result
}

export function generateFish(map, subPos, params=DEFAULT_PARAMS) {
    const result = []
    params.fishes.forEach(conf => {
        const count = paramValue(conf.count)
        for (var i = 0; i < count; i++) {
            const flockSize = conf.flockSize ? paramValue(conf.flockSize) : 1
            const fishes = makeFlock(map, subPos, params.startDistanceSubFromAggresive, conf.type, flockSize)
            result.push(...fishes)
        }
    })
    return result
}

