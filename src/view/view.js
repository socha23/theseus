import React from "react";
import {SubsystemCell, DropTargets, GRID_CELL_HEIGHT, GRID_CELL_WIDTH} from "./grid"
import {Subsystem} from "./subsystems"


function Sub({sub, actionController}) {
    return <div className='sub' style={{width: sub.gridWidth * GRID_CELL_WIDTH, height: sub.gridHeight * GRID_CELL_HEIGHT}}>
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
}


function GameView({model, actionController}) {
    return <div className="gameView">
        <Sub sub={model.sub} actionController={actionController}/>
    </div>
}

export default GameView;
