import {getStartingSub, getStartingWorld} from "./world"

class GameModel {
    constructor() {
        this.sub = getStartingSub()
        this.world = getStartingWorld()
    }

    updateState(deltaMs, actionController) {
        this.sub.updateState(deltaMs, this, actionController)
        this.world.updateState(deltaMs, this)
    }

    toViewState() {
        return {
            sub: this.sub.toViewState()
        }
    }
}

export default GameModel;
