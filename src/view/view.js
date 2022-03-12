import React from "react";
import {SubsystemCell, DropTargets, GRID_CELL_HEIGHT, GRID_CELL_WIDTH} from "./grid"
import {Subsystem} from "./subsystems"
import { TooltipArea } from "./tooltip";
import '../css/water.css';


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
    return  <div className="subContainer" style={{width: (sub.gridWidth + 1) * GRID_CELL_WIDTH, height: sub.gridHeight * GRID_CELL_HEIGHT}}>
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


function GameView({model, actionController}) {
    return <div className="gameView">
        <TooltipArea>
            <Sub sub={model.sub} actionController={actionController}/>
        </TooltipArea>
    </div>
}

export default GameView;
