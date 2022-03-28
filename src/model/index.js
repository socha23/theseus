import { Point } from "./physics"
import {getStartingSub, getStartingWorld, getStartingMaps} from "./world"

const MAX_TIME_FRAME_FOR_MODEL_UPDATE = 10

class GameModel {
    constructor() {
        this.sub = getStartingSub()

        const maps = getStartingMaps([0, 5, 10], this.sub.boundingBox)


        this.map = maps[0]
        this.map5 = maps[1]
        this.map10 = maps[2]

        this.world = getStartingWorld(this.map)
        this.target = {
            position: new Point(
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 1000),
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
