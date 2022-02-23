import React, { useEffect, useState } from "react";
import { SUBSYSTEM_CATEGORIES } from '../model/sub.js';
import { ACTION_CATEGORY } from "../model/action.js";
import Sonar from "./sonar.js";
import { toDegrees, toKph } from '../units.js'
import ReactSlider from "react-slider";


///////////////////////////////////


function AmmoBullet({spent}) {
    return <span className='bullet'>
        <i className={"fa-circle " + (spent ? "fa-regular": "fa-solid")}></i>
    </span>
}

function AmmoBar({subsystem}) {
    return <div className='ammo'>
        <span>Ammo: </span>
        {
            new Array(subsystem.ammoMax).fill(0).map((key, idx) =>
                 <AmmoBullet key={subsystem.i + "_ammo_" + idx} spent={idx >= subsystem.ammo}/>
            )
        }
    </div>
}

///////////////////////////////////

function SubStatus({subsystem}) {
    return <div className='subStatus'>
        <hr/>
        <div>
            <span>Position:</span>
            <span>{subsystem.position.x.toFixed(2)}, {subsystem.position.y.toFixed(2)}</span>
        </div>
        <hr/>
        <div>
            <span>Speed:</span>
            <span>{toKph(subsystem.speed).toFixed(2)} km/h</span>
        </div>
        <div>
            <span>Speed:</span>
            <span>{subsystem.speed.toFixed(2)} m/s</span>
        </div>
        <hr/>
        <div>
            <span>Orientation:</span>
            <span>{toDegrees(subsystem.orientation).toFixed(2)}'</span>
        </div>
        <div>
            <span>Rotation speed:</span>
            <span>{subsystem.rotationSpeed.toFixed(2)} m/s</span>
        </div>
    </div>
}
///////////////////////////////////

function Throttle({subsystem, actionController}) {
    return <div className='throttle'>
        <ReactSlider
            className="slider"
            thumbClassName="sliderThumb"
            trackClassName="sliderTrack"
            min={-4}
            max={4}
            onChange={(v, i) => actionController.setThrottle(v / 4)}
            value={4 * subsystem.throttle}
            />
    </div>
}

///////////////////////////////////

function DirectionActions({actions, actionController}) {
    return <div className='directionActions'>
        {
            actions.map(a => <ActionButton key={a.id} action={a} actionController={actionController}/>)
        }
    </div>
}

function ThrottleActions({actions, actionController}) {
    return <div className='throttleActions'>
        {
            actions.map(a => <ActionButton key={a.id} action={a} actionController={actionController}/>)
        }
    </div>
}
///////////////////////////////////

function Subsystem({subsystem, actionController}) {

    const standardActions = subsystem.actions.filter(a => a.category == ACTION_CATEGORY.STANDARD)
    const directionActions = subsystem.actions.filter(a => a.category == ACTION_CATEGORY.DIRECTION)
    const throttleActions = subsystem.actions.filter(a => a.category == ACTION_CATEGORY.THROTTLE)


    return <div className='subsystem'>
        <div className="titleBar">
            <span className='name'>{subsystem.name}</span>
        </div>
        {
            subsystem.usesAmmo && <AmmoBar subsystem={subsystem}/>
        }
        {
            subsystem.usesThrottle && <Throttle subsystem={subsystem} actionController={actionController}/>
        }
        {
            subsystem.showsSubStatus && <SubStatus subsystem={subsystem}/>
        }
        {
            subsystem.showsSonar && <Sonar subsystem={subsystem}/>
        }
        <div className='standardActions'>
            {
                standardActions.map(a => <ActionButton key={a.id} action={a} actionController={actionController}/>)
            }
        </div>
        {
            throttleActions && <ThrottleActions actions={throttleActions} actionController={actionController}/>
        }
        {
            directionActions && <DirectionActions actions={directionActions} actionController={actionController}/>
        }
    </div>
}


function Sub({sub, actionController}) {
    return <div className='sub'>
        <div className='subsystemsRow'>
            <div className="subsystemsColumn">
                {
                sub.subsystems
                    .filter(s => s.category == SUBSYSTEM_CATEGORIES.WEAPON)
                    .map(s => <Subsystem key={s.id} subsystem={s} actionController={actionController}/>)

                }
            </div>
            <div className="subsystemsColumn">
                {
                sub.subsystems
                    .filter(s => s.category == SUBSYSTEM_CATEGORIES.STATUS)
                    .map(s => <Subsystem key={s.id} subsystem={s} actionController={actionController}/>)

                }
            </div>
            <div className="subsystemsColumn">
                {
                sub.subsystems
                    .filter(s => s.category == SUBSYSTEM_CATEGORIES.NAVIGATION)
                    .map(s => <Subsystem key={s.id} subsystem={s} actionController={actionController}/>)

                }
            </div>
        </div>
    </div>
}


function ActionButton({action, actionController}) {
    const [recentlyCompleted, setRecentlyCompleted] = useState(false)

    if (action.recentlyCompleted && !recentlyCompleted) {
        setRecentlyCompleted(true)
            setTimeout(() => {
                setRecentlyCompleted(false)
            }, 500)
    }

    function getProgressWidth(action) {
        return action.progress * 100 / action.progressMax
    }

    return <div
        className={'button '
            + (recentlyCompleted ? "recentlyCompleted " : ' ')
            + (action.enabled ? "enabled " : 'disabled ')
            + (action.selected ? "selected " : "deselected ")
            + action.state + " "
        }
        onClick={e => actionController.onClick(action)}
        onMouseDown={e => actionController.onMouseDown(action)}
    >
        <div className='progressPadding'>
            <div className='progress' style={{width: getProgressWidth(action) + "%"}}/>
        </div>
        <div className='container'>
            <i className={'icon ' + action.iconClass}/>
            <span className={'name'}>
                {action.name}
            </span>
        </div>
    </div>
}

function GameView({model, actionController}) {
    return <div className="gameView">
        <Sub sub={model.sub} actionController={actionController}/>
    </div>
}

export default GameView;
