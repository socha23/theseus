import React, { useEffect, useState } from "react";
import GameModel from './model/model.js'
import GameView from './view/view.js';

class Game {
    constructor() {
        this.actionController = new ActionController()
        this.gameModel = new GameModel()
        this.lastStateUpate = Date.now()
    }

    updateState(state) {
        var time = Date.now()
        var delta = time - this.lastStateUpate
        if (delta == 0) {
            return
        }
        this.gameModel.updateState(delta, this.actionController)
        this.lastStateUpate = time
        this.actionController.reset()
        return this.gameModel.toViewState()
    }
}

class ActionController {

    constructor() {
        this._currentAction = null
        this.keysDown = {}
        this.keysPressed = {}
        this.targetEntityId = null
        this.values = {}

        this.movedSubsystemId = null
        this.movedSubsystemPosition = null
    }

    isCurrent(action) {
        return this._currentAction != null && action.id == this._currentAction.id
    }


    onClick(action) {
        if (!action.usesPressToActivate) {
            this._currentAction = action
        }
    }

    onMouseUp() {
        if (this._currentAction == null) {
            return
        }
        if (this._currentAction.usesPressToActivate) {
            this._currentAction = null
        }
    }

    onMouseDown(action) {
        if (action.usesPressToActivate) {
            this._currentAction = action
        }
    }


    isKeyDown(key) {
        return this.keysDown[key] === true
    }

    wasKeyPressed(key) {
        return this.keysPressed[key] === true
    }

    onKeyDown(key) {
        this.keysDown[key] = true
    }

    onKeyUp(key) {
        this.keysDown[key] = false
        this.keysPressed[key] = true
    }

    reset() {
        this.keysPressed = {}
        this.targetEntityId = null

        this.movedSubsystemId = null
        this.movedSubsystemPosition = null
    }

    onSubsystemMoved(id, position) {
        this.movedSubsystemId = id
        this.movedSubsystemPosition = position
    }

    resetCurrentAction() {
        this._currentAction = null
    }

    setValue(key, val) {
        this.values[key] = val
    }

    getValue(key, defVal) {
        return this.values[key] ?? defVal
    }
}

const TICK_MS = 33

const game = new Game()

function App() {
    const [gameState, setGameState] = useState(game.gameModel.toViewState())

    useEffect(() => {
        const interval = setInterval(_ => {
            setGameState(game.updateState(gameState))
        }, TICK_MS)
        return () => clearInterval(interval)
    })

    return (
        <div className="app"
            tabIndex={0}

                onMouseUp={e => game.actionController.onMouseUp()}
                onMouseLeave={e => game.actionController.onMouseUp()}

                onKeyDown={e => game.actionController.onKeyDown(e.key)}
                onKeyUp={e => game.actionController.onKeyUp(e.key)}
        >
            <GameView model={gameState} actionController={game.actionController}/>
        </div>
    );
}

export default App;
