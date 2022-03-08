import { Point } from "./physics"

export const MAP_FEATURE_TYPE = {
    DEFAULT: "default",
}

export class MapFeature {
    constructor(id, polygon, type=MAP_FEATURE_TYPE.DEFAULT) {
        this.id = id
        this.polygon = polygon
        this.type = type
    }
}



export class Map {

    static autoinc = 0

    constructor() {
        this.features = []
    }

    getFeaturesIntersecting(polygon) {
        return this.features
    }


    addFeature(polygon, type =MAP_FEATURE_TYPE.DEFAULT) {
        this.features.push(new MapFeature(("feature" + Map.autoinc++), polygon, type))
    }



}

