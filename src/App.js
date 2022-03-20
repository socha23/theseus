import React, { useEffect, useState } from "react";
import GameModel from './model'
import GameView from './view/view.js';
import {ActionController} from "./actionController"
import { commitFrameStats, STATISTICS } from "./stats"

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
var lastUpdate = window.performance.now()

function RunningGameView({game, onNewGame}) {
    const [gameState, setGameState] = useState(game.gameModel.toViewState())

    useEffect(() => {
        const interval = setInterval(_ => {
            const updateStart = window.performance.now()
            STATISTICS.RENDER_TIME_MS.add(updateStart - lastUpdate)
            const newState = game.updateState(gameState)
            STATISTICS.STATE_UPDATE_MS.add(window.performance.now() - updateStart)
            setGameState(newState)
            lastUpdate = window.performance.now()
            commitFrameStats()
        }, TICK_DELAY_MS)
        return () => clearInterval(interval)
    })

    return (
        <div
            tabIndex={0}
                onKeyDown={e => game.actionController.onKeyDown(e.key)}
                onKeyUp={e => game.actionController.onKeyUp(e.key)}
        >
            <GameView model={gameState} actionController={game.actionController} onNewGame={onNewGame}/>
        </div>
    );
}

function App() {
    const [game, setGame] = useState(new Game())

    return (
        <div className="app">
            <RunningGameView game={game} onNewGame={e => {setGame(new Game())}}/>
        </div>
    );
}

export default App;
