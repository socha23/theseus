import {getStartingSub, getStartingWorld, getStartingMap} from "./world"

const MAX_TIME_FRAME_FOR_MODEL_UPDATE = 20

class GameModel {
    constructor() {
        this.sub = getStartingSub()
        this.map = getStartingMap(this.sub.boundingBox)
        this.world = getStartingWorld(this.map)
    }

    updateState(deltaMs, actionController) {
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
    }

    toViewState() {
        return {
            sub: this.sub.toViewState()
        }
    }
}

export default GameModel;
