import { randomElem, paramColorValue, paramValue, paramFromValue } from "../utils"
import { Point, rectangle, SimpleRect, vectorForPolar } from "./physics"
import {plant} from "./plant"

const PLANTS = {
    GREEN_PLANT: {
        group: {
            size: {from: 10, to: 40},
            distance: {from: 2, to: 7}
        },
        name: "Green plant",
        radius: {from: 1.5, to: 4},
        color: {
            h: 122,
            s: 66,
            l: {from: 15, to: 30},
        },
    },
    PURPLE_PLANT: {
        group: {
            size: {from: 10, to: 20},
            distance: {from: 4, to: 20}
        },
        name: "Purple shroom",
        radius: {from: 4, to: 8},
        color: {
            h: {from: 275, to: 320},
            s: {from: 66, to: 100},
            l: {from: 30, to: 50},
        },
    },
}

const DEFAULT_PARAMS = {
    plants: [
        {
            type: PLANTS.GREEN_PLANT,
            count: 200,
        },
        {
            type: PLANTS.PURPLE_PLANT,
            count: 50,
        }
    ]
}

function makeGroup(map, params) {
    const positions = []
    const result = []

    var pos = map.randomPosition(0.1)
    var minDist = paramFromValue(params.group.distance)


    var radius = 0
    for (var i = 0; i < paramValue(params.group.size); i++) {
        radius = paramValue(params.radius)

        var recount = 0
        // now let's find position where it fits
        while (
            positions.some(p => p.distanceTo(pos) < minDist)
            || map.detectCollision(new rectangle(pos, new Point(0.1, 0.1)))

            ) {
                recount++
                if (recount == 1000) {
                    return result
                }
                const from = (positions.length == 0 ? pos : randomElem(positions))
                const theta = Math.random() * 2 * Math.PI
                const distance = paramValue(params.group.distance)
                pos = from.plus(vectorForPolar(distance, theta))
        }
        positions.push(pos)
        result.push(plant(pos, {...params,
            radius: radius,
            color: paramColorValue(params.color)

        }))
    }
    return result
}


export function generatePlants(map, params=DEFAULT_PARAMS) {
    const result = []
    params.plants.forEach(conf => {
        for(var i = 0; i < conf.count; i++) {
            const plants = makeGroup(map, conf.type)
            plants.forEach(plant => {
                map.addPlant(plant)
                result.push(plant)
            })
        }
    })
    return result
}
