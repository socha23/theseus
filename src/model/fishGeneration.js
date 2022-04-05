import { Body, Point, rectangle, vectorForPolar, Volume, Polygon } from "./physics"
import { randomElem, transpose } from "../utils"
import { Fish } from "./fish"
import { flockAI} from "./flockAi"
import { fishAI } from "./fishAi"



const FISH_TEMPLATES = {
    SMALL_FISH: {
        id: "small_fish",
        volume: new Volume(0.5, 0.5, 2, 0.2),
        tailForce: 2 * 1000,
        rotationalForce: 1 * 1000,
        rotationSpeed: 1,
        color: "#AEF3E7"
    },
    GOAT_FISH: {
        id: "goat_fish",
        volume: new Volume(1, 1, 3, 0.2),
        tailForce: 5 * 1000,
        rotationalForce: 2 * 1000,
        rotationSpeed: 1,
        color: "#4287f5",
        territoryRange: 30,
    },
    FAT_FISH: {
        id: "fat_fish",
        volume: new Volume(2, 2, 3, 0.2),
        tailForce: 15 * 1000,
        rotationalForce: 2 * 1000,
        rotationSpeed: 1,
        color: "#E08E45",
        aggresive: true,
        defaultSubFear: -20,
        sightRange: 50,
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
        defaultSubFear: -40,
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


function flockSize(from, to) {
    return Math.floor(transpose(Math.random(), 0, 1, from, to))
}

var autoinc = 0

function fishInCave(c, template, ai=fishAI) {
    const wallRadius = template.volume.radius * 2
    const pos = c.polygon(-wallRadius).randomPoint()
    const fish = new Fish(
        template.id + autoinc++,
        new Body(pos, template.volume, Math.random() * 2 * Math.PI),
        template,
        ai)
    return fish
}


function fishesInCave(c, template, count) {
    const result = []
    for (var i = 0; i < count; i++) {
        result.push(fishInCave(c, template))
    }
    return result
}


function flockInCave(c, template, count) {
    const result = []
    for (var i = 0; i < count; i++) {
        const f = fishInCave(c, template, flockAI())
        result.push(f)
    }
    return result
}

export function generateFish(map) {
    const res = []
    map.caves.forEach(c => {

        const r = Math.random()

        const aggresive = !c.startingArea

        if (c.startingArea) {
            res.push(...flockInCave(c, FISH_TEMPLATES.SMALL_FISH, flockSize(20, 30)))
            res.push(...fishesInCave(c, FISH_TEMPLATES.GOAT_FISH, flockSize(2, 5)))
        }


        if (c.size < 20) {
            if (r < 0.3) {
                res.push(...flockInCave(c, FISH_TEMPLATES.SMALL_FISH, flockSize(4, 10)))
            } else if (r < 0.5) {
                res.push(...fishesInCave(c, FISH_TEMPLATES.GOAT_FISH, flockSize(1, 6)))
            } else {
                // no fish
            }
        } else if (c.size < 70) {
            if (Math.random() < 0.1 && aggresive) {
                res.push(fishInCave(c, FISH_TEMPLATES.BIG_FISH))
            }
            if (Math.random() < 0.5 && aggresive) {
                res.push(...fishesInCave(c, FISH_TEMPLATES.FAT_FISH, flockSize(1, 4)))
            }

            if (Math.random() < 0.3) {
                res.push(...fishesInCave(c, FISH_TEMPLATES.GOAT_FISH, flockSize(5, 10)))
            }
            if (Math.random() < 0.5) {
                res.push(...flockInCave(c, FISH_TEMPLATES.SMALL_FISH, flockSize(4, 10)))
            }
            if (Math.random() < 0.5) {
                res.push(...flockInCave(c, FISH_TEMPLATES.SMALL_FISH, flockSize(4, 10)))
            }
            if (Math.random() < 0.5) {
                res.push(...flockInCave(c, FISH_TEMPLATES.SMALL_FISH, flockSize(4, 10)))
            }
        } else {
            if (Math.random() < 0.7 && aggresive) {
                res.push(...fishesInCave(c, FISH_TEMPLATES.BIG_FISH, flockSize(1, 4)))
            }
            if (Math.random() < 0.7 && aggresive) {
                res.push(...fishesInCave(c, FISH_TEMPLATES.FAT_FISH, flockSize(3, 6)))
            }

            if (Math.random() < 0.5) {
                res.push(...fishesInCave(c, FISH_TEMPLATES.GOAT_FISH, flockSize(5, 20)))
            }
            if (Math.random() < 0.5) {
                res.push(...flockInCave(c, FISH_TEMPLATES.SMALL_FISH, flockSize(4, 10)))
            }
            if (Math.random() < 0.5) {
                res.push(...flockInCave(c, FISH_TEMPLATES.SMALL_FISH, flockSize(4, 10)))
            }
            if (Math.random() < 0.5) {
                res.push(...flockInCave(c, FISH_TEMPLATES.SMALL_FISH, flockSize(4, 10)))
            }

        }

    })
    console.log("Generated " + res.length + " fishes")
    return res


//    return [

            //...createFlock(map, FISH_TEMPLATES.SMALL_FISH, 10, new Point(20, 20), 40).entities,
            //...createFlock(map, FISH_TEMPLATES.SMALL_FISH, 10, new Point(-20, -20), 40).entities,
            //...createFish(map, FISH_TEMPLATES.FAT_FISH, 50, Point.ZERO, 400, 70),
            //...createFish(map, FISH_TEMPLATES.BIG_FISH, 15, Point.ZERO, 400, 70),
            //...createFish(map, FISH_TEMPLATES.GOAT_FISH, 20, Point.ZERO, 400, 30),

//                        ...createFish(map, FISH_TEMPLATES.GOAT_FISH, 10, Point.ZERO, 20),


  //  ]
}




