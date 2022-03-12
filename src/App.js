import React, { useEffect, useState } from "react";
import GameModel from './model'
import { STATISTICS } from "./stats";
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
        if (delta === 0) {
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
        this._mouseOverSubsystems = {}
        this._activeActions = {}
        this.keysDown = {}
        this.keysPressed = {}
        this.targetEntityId = null
        this.values = {}

        this.movedSubsystemId = null
        this.movedSubsystemPosition = null
    }

    isCurrent(action) {
        return ((this._activeActions[action.id] ?? null) != null)
            || (action.key && this.isKeyDown(action.key))
    }

    onClick(action) {
        if (!action.usesPressToActivate) {
            this._activeActions[action.id] = action
        }
    }

    onMouseOver(subsystem) {
        this._mouseOverSubsystems[subsystem.id] = subsystem
    }

    onMouseOut(subsystem) {
        delete this._mouseOverSubsystems[subsystem.id]
    }

    isMouseOver(subsystem) {
        return (this._mouseOverSubsystems[subsystem.id] ?? null) != null
    }

    onMouseUp() {
        Object.values(this._activeActions)
            .filter(a => a.usesPressToActivate)
            .forEach(a => {delete this._activeActions[a.id]})
    }

    onMouseDown(action) {
        if (action.usesPressToActivate) {
            this._activeActions[action.id] = action
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

        Object.values(this._activeActions)
            .filter(a => !a.usesPressToActivate)
            .forEach(a => {delete this._activeActions[a.id]})
    }

    onSubsystemMoved(id, position) {
        this.movedSubsystemId = id
        this.movedSubsystemPosition = position
    }

    setValue(key, val) {
        this.values[key] = val
    }

    getValue(key, defVal) {
        return this.values[key] ?? defVal
    }
}

const TICK_DELAY_MS = 0
const game = new Game()

var lastUpdate = Date.now()

function App() {
    const [gameState, setGameState] = useState(game.gameModel.toViewState())


    useEffect(() => {
        const interval = setInterval(_ => {
            const updateStart = Date.now()
            STATISTICS.RENDER_TIME_MS.add(updateStart - lastUpdate)
            const newState = game.updateState(gameState)
            STATISTICS.STATE_UPDATE_MS.add(Date.now() - updateStart)
            //console.log("Update took", Date.now() - updateStart)
            setGameState(newState)
            lastUpdate = Date.now()
        }, TICK_DELAY_MS)
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
