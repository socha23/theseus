import { Point } from "./physics"
import {getStartingSub} from "./world"
import { getStartingMap } from "./mapGeneration"
import { generateFish } from "./fishGeneration"

const MAX_TIME_FRAME_FOR_MODEL_UPDATE = 10

class GameModel {
    constructor() {
        this.map = getStartingMap()

        const startCave = this.map.getBottomLeftCave()
        startCave.startingArea = true
        const subPos = startCave.position

        this.sub = getStartingSub(subPos)
        this.world = new World(generateFish(this.map))
        this.target = {
            position: this.map.getTopRightCave().position,
            name: "Goal"
        }
    }

    updateState(deltaMs, actionController) {
        if (this.isGameOver() || this.isWin()) {
            return
        }
        while (deltaMs > MAX_TIME_FRAME_FOR_MODEL_UPDATE) {
            this._updateInner(MAX_TIME_FRAME_FOR_MODEL_UPDATE, actionController)
            deltaMs -= MAX_TIME_FRAME_FOR_MODEL_UPDATE
        }
        this._updateInner(deltaMs, actionController)
    }

    _updateInner(deltaMs, actionController) {
        this.sub.updateState(deltaMs, this, actionController)
        this.world.updateState(deltaMs, this)
        if (actionController.targetEntityId && !this.world.entitiesById[actionController.targetEntityId]) {
            actionController.targetEntityId = null
        }
        actionController.reset()
    }

    isGameOver() {
        return this.sub.waterLevel >= 5
    }

    isWin() {
        return this.sub.position.distanceTo(this.target.position) < 10
    }

    toViewState() {
        return {
            sub: this.sub.toViewState(),
            target: this.target,
            gameOver: this.isGameOver(),
            win: this.isWin(),
        }
    }
}



class World {
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



export default GameModel;
