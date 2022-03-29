import { Point } from "./physics"
import {getStartingSub} from "./startingSub"
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

        this.entities = []
        this.entitiesById = {}


        generateFish(this.map).forEach(f => {
            this.addEntity(f)
        })

        this.target = {
            position: this.map.getTopRightCave().position,
            name: "Goal"
        }
    }

    addEntity(e) {
        this.entities.push(e)
        this.entitiesById[e.id] = e
        this.map.addEntity(e)
    }

    getEntity(id) {
        return this.entitiesById[id]
    }

    _updateEntities(deltaMs) {
        const newEntities = []
        this.entities.forEach(e => {
            e.updateState(deltaMs, this)
            if (e.deleted) {
                delete this.entitiesById[e.id]
            } else {
                newEntities.push(e)
            }
        })
        this.entities = newEntities
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
        this._updateEntities(deltaMs)
        this.map.updateState()

        if (actionController.targetEntityId && !this.entitiesById[actionController.targetEntityId]) {
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

export default GameModel;
