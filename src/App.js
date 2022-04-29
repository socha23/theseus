import React, { useEffect, useRef, useState } from "react";
import GameModel from './model'
import GameView from './view/view.js';
import {ActionController} from "./actionController"
import { commitFrameStats, STATISTICS } from "./stats"

class Game {
    constructor() {
        this.actionController = new ActionController()
        this.gameModel = new GameModel()
        this.lastStateUpate = window.performance.now()
    }

    updateState() {
        var time = window.performance.now()
        var delta = time - this.lastStateUpate
        if (delta === 0) {
            return this.gameModel.toViewState()
        }
        this.gameModel.updateState(delta, this.actionController)
        STATISTICS.STATE_UPDATE_MS.add(window.performance.now() - time)
        this.lastStateUpate = time
        return this.gameModel.toViewState()
    }

    reset() {
        this.gameModel = new GameModel()
    }
}

// from https://codesandbox.io/s/requestanimationframe-with-hooks-0kzh3?from-embed
const useAnimationFrame = (callback) => {
    const requestRef = React.useRef()
    const previousTimeRef = React.useRef()
    React.useEffect(() => {
        const animate = time => {
            if (previousTimeRef.current !== undefined) {
                const deltaMs = time - previousTimeRef.current
                callback(deltaMs)
            }
            previousTimeRef.current = time
            requestRef.current = requestAnimationFrame(animate)
        }
        requestRef.current = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(requestRef.current)
    }, [])
}

var lastUpdate = window.performance.now()

function RunningGameView({game, onNewGame}) {
    const [gameState, setGameState] = useState(game.gameModel.toViewState())
    const mainDivRef = useRef(null)

    useEffect(() => {
        if (mainDivRef.current) {
            mainDivRef.current.focus()
        }
    }, [])

    useAnimationFrame(deltaMs => {
        STATISTICS.RENDER_TIME_MS.add(window.performance.now() - lastUpdate)
        const newState = game.updateState()
        setGameState(newState)
        lastUpdate = window.performance.now()
        commitFrameStats()
    })

    return (
        <div
            ref={mainDivRef}
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
            <RunningGameView game={game} onNewGame={e => {game.reset()}}/>
        </div>
    )
}

export default App;
