import React, { useEffect, useState } from "react";
import GameModel from './model'
import { commitStats, STATISTICS } from "./stats";
import GameView from './view/view.js';
import {ActionController} from "./actionController"

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
        return this.gameModel.toViewState()
    }
}


const TICK_DELAY_MS = 0
const game = new Game()

var lastUpdate = window.performance.now()

function App() {
    const [gameState, setGameState] = useState(game.gameModel.toViewState())


    useEffect(() => {
        const interval = setInterval(_ => {
            const updateStart = window.performance.now()
            STATISTICS.RENDER_TIME_MS.add(updateStart - lastUpdate)
            const newState = game.updateState(gameState)
            STATISTICS.STATE_UPDATE_MS.add(window.performance.now() - updateStart)
            setGameState(newState)
            lastUpdate = window.performance.now()
            commitStats()
        }, TICK_DELAY_MS)
        return () => clearInterval(interval)
    })

    return (
        <div className="app"
            tabIndex={0}
                onKeyDown={e => game.actionController.onKeyDown(e.key)}
                onKeyUp={e => game.actionController.onKeyUp(e.key)}
        >
            <GameView model={gameState} actionController={game.actionController}/>
        </div>
    );
}

export default App;
