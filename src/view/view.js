import React, { useContext } from "react";
import {SubsystemCell, DropTargets, GRID_CELL_HEIGHT, GRID_CELL_WIDTH} from "./grid"
import {Subsystem} from "./subsystems"
import { TooltipArea } from "./tooltip";
import { AvailableInventory, RequiredInventory } from "./materials";
import { ActionControllerCtx } from "../actionController";
import '../css/water.css';
import '../css/gameOver.css';


function Water({waterLevel}) {
    const MARGIN_BOTTOM = 50
    const height = waterLevel * GRID_CELL_HEIGHT + MARGIN_BOTTOM

    return <div className="water" style={{bottom: -MARGIN_BOTTOM, height: height}}></div>
}


function Sub({sub, actionController}) {
    var subClass = ""
    sub.effects.forEach(e => {
        subClass += e.type + " "
    })
    return <div className="subContainer" style={{width: (sub.gridWidth + 1) * GRID_CELL_WIDTH, height: sub.gridHeight * GRID_CELL_HEIGHT}}>
            <div className={'sub ' + subClass}>
                    <div className='subsystems' >
                    {
                        sub.subsystems
                                .map(s =>
                                <SubsystemCell key={s.id + "_cell"} subsystem={s}>
                                    <Subsystem key={s.id} subsystem={s} actionController={actionController}/>
                                </SubsystemCell>
                                )}
                    </div>
                    <DropTargets sub={sub} actionController={actionController}/>
                            </div>
            {(sub.waterLevel > 0) && <Water waterLevel={sub.waterLevel}/>}
        </div>
}


function GameView({model, actionController, onNewGame}) {
    const availableInventory = useContext(AvailableInventory)
    const requiredInventory = useContext(RequiredInventory)
    availableInventory.values = model.sub.inventory
    return <div className="gameView">
        <ActionControllerCtx.Provider value={actionController}>
            <AvailableInventory.Provider value={availableInventory}>
                <RequiredInventory.Provider value={requiredInventory}>
                <TooltipArea>
                    <Sub sub={model.sub} actionController={actionController}/>
                </TooltipArea>
                </RequiredInventory.Provider>
            </AvailableInventory.Provider>
        </ActionControllerCtx.Provider>
        {
            model.gameOver && <GameOverScreen onNewGame={onNewGame}/>
        }
        {
            model.win && <WinScreen onNewGame={onNewGame}/>
        }
    </div>
}


function GameOverScreen({onNewGame}) {
    return <div className="gameOverContainer">
        <div className="gameOverScreen">
            <div className="gameOver">Game over!</div>
            <div className="playAgain" onClick={onNewGame}>Play again</div>
        </div>
    </div>
}

function WinScreen({onNewGame}) {
    return <div className="gameOverContainer">
        <div className="gameOverScreen">
            <div className="gameOver">Congratulations, you won!</div>
            <div className="playAgain" onClick={onNewGame}>Play again</div>
        </div>
    </div>
}


export default GameView;
