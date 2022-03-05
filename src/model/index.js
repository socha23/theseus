import {getStartingSub, getStartingWorld} from "./world"

class GameModel {
    constructor() {
        this.sub = getStartingSub()
        this.world = getStartingWorld()
    }

    updateState(deltaMs, actionController) {
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
