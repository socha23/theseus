import { Point } from "./physics"
import {getStartingSub, getStartingWorld} from "./world"
import { getStartingMap } from "./mapGeneration"

const MAX_TIME_FRAME_FOR_MODEL_UPDATE = 10

class GameModel {
    constructor() {
        this.map = getStartingMap()
        const subPos = this.map.getBottomLeftCave().position
        this.sub = getStartingSub(subPos)
        this.world = getStartingWorld(this.map)
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

export default GameModel;
