import { Body, Volume } from "./physics"
import { Entity } from "./entities"

const DEFAULT_PLANT_PARAMS = {
    name: "Plant",
    radius: 2,
    color: "green",
}

var autoinc = 0

export class Plant extends Entity {
    constructor(id, body, params) {
        super(id, body)
        this.params = {...DEFAULT_PLANT_PARAMS, ...params}
    }

    get color() {
        return this.params.color
    }

    toViewState() {
        const v = super.toViewState()
        v.isPlant = true
        v.alive = true
        return v
    }
}

export function plant(position, params) {
    params = {...DEFAULT_PLANT_PARAMS, ...params}
    const id = params.name + " " + (autoinc++)
    const body = new Body(position, new Volume(params.radius, params.radius, params.radius))
    return new Plant(id, body, params)
}
