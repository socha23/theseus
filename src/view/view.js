import React, { useEffect, useState } from "react";
import { SUBSYSTEM_CATEGORIES } from '../model/sub.js';
import { ACTION_CATEGORY } from "../model/action.js";
import Sonar from "./sonar.js";
import { toDegrees, toKph } from '../units.js'
import ReactSlider from "react-slider";
import { CartesianGrid, Area, AreaChart, Line, LineChart, XAxis, YAxis } from "recharts";


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
    return <div className='subStatus boxWithScroll'>
        {subsystem.on && <div>
        <div className="infoRow">
            <span>Pos:</span>
            <span>{subsystem.position.x.toFixed(1)}, {subsystem.position.y.toFixed(1)}</span>
        </div>
        <div className="infoRow">
            <span>Speed:</span>
            <span>{subsystem.speed.toFixed(2)} m/s</span>
        </div>
        <hr/>
        <div className="infoRow">
            <span>Heading:</span>
            <span>{toDegrees(subsystem.orientation).toFixed(2)}'</span>
        </div>
        <div className="infoRow">
            <span>Rot. speed:</span>
            <span>{subsystem.rotationSpeed.toFixed(2)} m/s</span>
        </div>

        </div>}
    </div>
}

///////////////////////////////////

function Tracking({subsystem}) {
    const tracking = subsystem.tracking
    return <div className='tracking infoBox'>

        {subsystem.on && <div className="trackedEntity">
            { tracking ? <div>
                <div className="infoRow">
                    <span className="label">Id:</span>
                    <span>{tracking.entityId}</span>
                </div>
                <hr/>
                <div className="infoRow">
                    <span className="label">Pos:</span>
                    <span>{tracking.position.x.toFixed(2)}, {tracking.position.y.toFixed(2)}</span>
                </div>
                <div className="infoRow">
                    <span className="label">Speed:</span>
                    <span>{tracking.speed.toFixed(2)} m/s</span>
                </div>
                <hr/>
                {tracking.planDescription && <div>
                    <span>{tracking.planDescription}</span>
                </div>
                }
            </div> : "Nothing tracked"}
        </div>}
    </div>
}
///////////////////////////////////


function VertSlider({id, actionController, children, enabled=true}) {
    return <div className="vertSliderContainer">
    <ReactSlider
    className={"vertSlider " + (enabled ? "enabled " : "disabled ")}
    thumbClassName="sliderThumb"
    trackClassName="sliderTrack"
    min={0}
    max={100}
    disabled={!enabled}
    orientation="vertical"
    onChange={(v, i) => actionController.setValue(id, 1-(v / 100))}
    value={100 - (100 * actionController.getValue(id, 0))}
    />
    <div>{children}</div>
    </div>



}


function ReactorHistory({subsystem}) {
    const WIDTH = 210
    const HEIGHT = 200

    const history = subsystem.history
    const histGridTimePoints = []

    const time = subsystem.historyTo - subsystem.historyFrom



    const MS_PER_STEP = 5000
    const PX_PER_STEP = WIDTH * MS_PER_STEP / time

    const phase = 1 - (subsystem.historyFrom % MS_PER_STEP) / MS_PER_STEP
    for (var x = phase * PX_PER_STEP; x <= WIDTH; x += PX_PER_STEP) {
        histGridTimePoints.push(x)
    }
    return <div className='history' style={{width: WIDTH, height: HEIGHT}}>
        {subsystem.on &&
            <div className="chart">
                <AreaChart margin={{top: 0, left: 0, right: 0, bottom: 0}} width={WIDTH} height={HEIGHT} data={history}>
                    <CartesianGrid verticalPoints={histGridTimePoints} stroke="#469528"/>
                    <YAxis hide={true} type="number" domain={[0, subsystem.maxOutput]}/>
                    <XAxis hide={true} type="number" domain={[subsystem.historyFrom + 200, subsystem.historyTo - 200]} dataKey="timeMs"/>
                    <Area dataKey="output" stroke="#a5d000" strokeWidth={3} fill="green"/>
                    <Area dataKey="consumption" stroke="red" strokeWidth={3} fill="#6f0000"/>
                </AreaChart>
            </div>}
    </div>

}


function Reactor({subsystem, actionController}) {
    return <div className='reactor'>
        <div className='controls'>
            <VertSlider id={subsystem.id + "_control"} actionController={actionController} enabled={subsystem.on}>
                <i className="fa-solid fa-atom"></i>
            </VertSlider>
        </div>
        <div>
            <ReactorHistory subsystem={subsystem}/>
            <div className='fuel'>
            </div>
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

    const [power, setPower] = useState(false)
    const [animation, setAnimation] = useState("")

    if (subsystem.shutdown && power) {
        setPower(false)
        setAnimation("shutdown")
        setTimeout(() => {
            setAnimation("")
        }, 500)
    }

    if (subsystem.on && !power) {
        setPower(true)
        setAnimation("poweringUp")
        setTimeout(() => {
            setAnimation("")
        }, 500)
    }

    if (!subsystem.on && !subsystem.shutdown && power) {
        setPower(false)
        setAnimation("poweringDown")
        setTimeout(() => {
            setAnimation("")
        }, 500)
    }

    const standardActions = subsystem.actions.filter(a => a.category == ACTION_CATEGORY.STANDARD)
    const directionActions = subsystem.actions.filter(a => a.category == ACTION_CATEGORY.DIRECTION)
    const throttleActions = subsystem.actions.filter(a => a.category == ACTION_CATEGORY.THROTTLE)


    return <div className={'subsystem '
                + (subsystem.on ? 'powered ' : 'unpowered ')
                + (animation + " ")
                }>
        <div className="titleBar">
            <span className='name'>{subsystem.name}</span>

            <div className='powerButton'>
                <ActionButton action={subsystem.actionOn} actionController={actionController}/>
            </div>
        </div>
        <div className='body'>
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
            subsystem.showsTracking && <Tracking subsystem={subsystem}/>
        }
        {
            subsystem.showsSonar && <Sonar subsystem={subsystem} actionController={actionController}/>
        }
        {
            subsystem.isReactor && <Reactor subsystem={subsystem} actionController={actionController}/>
        }
        <div className='standardActions'>
            {
                standardActions.map(a => <ActionButton key={a.id} action={a} actionController={actionController}/>)
            }
        </div>
        {
            (throttleActions.length > 0) && <ThrottleActions actions={throttleActions} actionController={actionController}/>
        }
        {
            (directionActions.length > 0) && <DirectionActions actions={directionActions} actionController={actionController}/>
        }
        </div>
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
                    .filter(s => s.category == SUBSYSTEM_CATEGORIES.SONAR)
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
            + (recentlyCompleted ? "recentlyCompleted " : ' ')
            + (action.enabled ? "enabled " : 'disabled ')
            + (action.selected ? "selected " : "deselected ")
            + action.state + " "
        }
        onClick={e => actionController.onClick(action)}
        onMouseDown={e => actionController.onMouseDown(action)}
    >
        <div className='container'>
            <i className={'icon ' + action.iconClass}/>
            <span className={'name'}>
                {action.name}
            </span>
            <div className='rightSide'/>
        </div>
        {
            (action.progressMax > 0) && <div className='progressContainer'>
            <div className='progress' style={{width: getProgressWidth(action) + "%"}}/>
        </div>



        }
    </div>
}

function GameView({model, actionController}) {
    return <div className="gameView">
        <Sub sub={model.sub} actionController={actionController}/>
    </div>
}

export default GameView;
