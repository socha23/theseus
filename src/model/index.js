import { Point, Vector } from "./physics"
import {getStartingSub} from "./startingSub"
import { getStartingMap } from "./mapGeneration"
import { generateFish } from "./fishGeneration"
import { generatePlants } from "./plantGeneration"
import { AvoidEntity } from "./fishAi"

const MAX_TIME_FRAME_FOR_MODEL_UPDATE = 10
const ENTITY_ACTIVATION_DISTANCE = 200

class GameModel {
    constructor() {
        this.map = getStartingMap()



        const startCave = this.map.getBottomLeftCave()
        startCave.startingArea = true
        const subPos = startCave.position
        this.sub = getStartingSub(subPos)

        this.entities = []
        this.entitiesById = {}
        generateFish(this.map, this.sub.position).forEach(f => {
            this.addEntity(f)
            f.init(this)
        })



        this.plantsById = {}
        generatePlants(this.map).forEach(f => {
            this.plantsById[f.id] = f
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
        return this.entitiesById[id] || this.plantsById[id]
    }

    _updateEntities(deltaMs) {
        var eIdx = 0
        while (eIdx < this.entities.length) {
            const e = this.entities[eIdx]
            if (e.position.inRange(this.sub.position, ENTITY_ACTIVATION_DISTANCE)) {
                const prevBox = e.boundingBox
                e.updateState(deltaMs, this)
                this.map.updateEntity(e, prevBox)
            }
            if (!e.deleted) {
                eIdx++
            } else {
                this.entities.splice(eIdx, 1)
                delete this.entitiesById[e.id]
                this.map.removeEntity(e)
            }
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
        this._updateEntities(deltaMs)

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
